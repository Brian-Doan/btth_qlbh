var express = require('express');
var router = express.Router();


// Load Page model
var Page = require('../models/page');

/*
* GET 
*/
router.get('/', (req,res) => {
    Page.findOne({slug: 'home'}, (err,page) => {
        if (err) {
            console.log(err);
        }
        res.render('index', {
            title: page.title,
            content: page.content
        });
    });
});

/*
* GET a page
*/
router.get('/:slug', (req,res) => {

    var slug = req.params.slug;

    Page.findOne({slug: slug}, (err,page) => {
        if (err) {
            console.log(err);
        }
        if (!page) {
            res.redirect('/');
        } else {
            res.render('index', {
                title: page.title,
                content: page.content
            });
        }
    });
});

// Exports module
module.exports = router;