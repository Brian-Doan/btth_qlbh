var express = require('express');
var router = express.Router();
var fs = require('fs-extra')
var auth = require('../config/auth');
var isUser = auth.isUser;
const { fstat } = require('fs-extra');

// Load Product model
var Hoa = require('../models/product');

// Load Category model
var LoaiHoa = require('../models/category');

// Convert string to find product base on customers' search
var escapeRegex = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$!#\s]/g, "\\$&");
}

/*
* GET all products
*/
router.get('/all', (req,res) => {
    var loggedIn = (req.isAuthenticated()) ? true : false;

    var noSearch = '';
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Hoa.find({$or: [{title: regex}, {category: regex}]}, (err,hoas) => {
            if (err) {
                console.log(err);
            }
            if (hoas.length < 1) {
                noSearch = "No product matches your search. Please try again.";
            }
            res.render('all_products', {
                title: 'All products',
                hoas: hoas,
                noSearch: noSearch,
                loggedIn: loggedIn
            });
        });
    }

    Hoa.find((err,hoas) => {
        if (err) {
            console.log(err);
        }
        res.render('all_products', {
            title: 'All products',
            hoas: hoas,
            noSearch: noSearch,
            loggedIn: loggedIn
        });
    });
});

/*
* GET products by category
*/
router.get('/:category', (req,res) => {

    var loggedIn = (req.isAuthenticated()) ? true : false;

    var categorySlug = req.params.category;
    LoaiHoa.findOne({slug: categorySlug}, (err,category) => {
        Hoa.find({category: categorySlug}, (err,products) => {
            if (err) {
                console.log(err);
            }
            res.render('category_products', {
                title: category.title,
                hoas: products,
                loggedIn: loggedIn
            });
        });
    });
});

/*
* GET product details
*/
router.get('/:category/:product', (req,res) => {

    var loggedIn = (req.isAuthenticated()) ? true : false;

    Hoa.findOne({slug: req.params.product}, (err, product) => {
        if (err) {
            console.log(err);
        } else {
            res.render('product', {
                title: req.params.product,
                hoa: product,
                loggedIn: loggedIn
            })
        }
    })
});

// Exports module
module.exports = router;