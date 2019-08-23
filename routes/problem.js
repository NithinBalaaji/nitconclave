const problemRouter = require('express').Router();
var Problem = require('../models/problem');
var User = require('../models/user');
var mongoose = require('mongoose');
const { isLoggedIn } = require('../middlewares/auth');

problemRouter.post('/create', isLoggedIn, function (req, res) {

    if (
        !req.body.name ||
        !req.body.desc ||
        !req.body.amount
    ) {
        console.log("Request parameters at problem/create not sufficient");
        res.json({ success: false });
    }
    else {
        var problem = new Problem();
        problem.name = req.body.name;
        problem.owner = req.user;
        problem.desc = req.body.desc;
        problem.amount = req.body.amount;
        problem.save(function (err) {
            if(err){
                console.log("Error in saving problem");
                res.json({success: false});
            }
            else{
                res.json({ success: true });
            }
        })

    }

})

problemRouter.get('/', function (req, res) {
    Problem.find({}).exec(function (err, problems) {
        if (err) {
            res.json({ success: false });
        }
        else {
            res.json({ success: true, problemList: problems });
        }
    })
})

problemRouter.get('/:id', function (req, res) {
    Problem.findById(req.params.id, function (err, problem) {
        if (err || !problem) {
            console.log("Error or Project with the given id does not exists.");
            res.json({ success: false });
        }
        else {
            res.json({ success: true, problem: problem });
        }
    })
})

problemRouter.post('/:id/propose', function (req, res) {
    Problem.findById(req.params.id, function (err, problem) {
        if (err || !problem) {
            console.log("Error or Problem with the given id does not exists.");
            res.json({ success: false });
        }
        else if(problem.allotedTo){
            console.log("Problem already alloted.");
            res.json({success: false});
        }
        else {
            let proposal = new Object();
            proposal.owner=req.user;
            proposal.desc = req.body.desc;
            problem.proposal.push(proposal);
            problem.save(function (err) {
                if (err) {
                    console.log("Error in saving problem");
                    res.json({ success: false });
                }
                else {
                    res.json({ success: true });
                }
            })
        }
    })
})

problemRouter.post("/:id/acceptpropose/:userid", function (req, res) {
    Problem.findById(req.params.id, function (err, problem) {
        if (err || !problem) {
            console.log("Error or Problem with the given id does not exists.");
            res.json({ success: false });
        }
        else if (req.user._id.toString() != problem.owner.toString()) {
            console.log("Request not made by owner of the project.");
            res.json({ success: false });
        }
        else {
            User.findById(req.params.userid, function (err, user) {
                if (err || !user) {
                    console.log("Error or User with the given id does not exist.");
                    res.json({ success: false });
                }
                else{
                    let flag=false;
                    problem.proposal=problem.proposal.filter(preq => {
                        flag=(flag||(preq.owner.toString()==req.params.userid));
                        return preq.owner.toString()!=req.params.userid;
                    })
                    if(!flag){
                        console.log("No proposal by passed userid");
                        res.json({success: false});
                    }
                    else{
                        problem.allotedTo=req.user;
                        problem.proposal=[];
                        problem.save(function(err){
                            if(err){
                                console.log("Error in saving updated problem");
                                res.json({success: false});
                            }
                            else {
                                res.json({success: true});
                            }
                        })
                    }
                }
            })
        }
    })
})


module.exports = problemRouter;
