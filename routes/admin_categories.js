var express = require('express');
var router = express.Router();
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

// Load Category model
var LoaiHoa = require('../models/category');

/* 
* GET category index
*/
router.get('/', isAdmin, (req,res) => {
    LoaiHoa.find((err, loaihoa) => {
        if (err) return console.log(err);
        res.render('admin/categories', {
            loaihoa: loaihoa
        });
    });
});

/* 
* GET add category
*/
router.get('/add-category', isAdmin, (req,res) => {
    var title = "";

    res.render('admin/add_category', {
       title: title,
    })
});

/* 
* POST add category
*/
router.post('/add-category',  (req,res) => {
    req.checkBody('title','Title must have a value').notEmpty();

    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();

    var errors = req.validationErrors();

    if(errors) {
        res.render('admin/add_category', {
            errors: errors,
            title: title
        });
    } else {
        LoaiHoa.findOne({slug: slug}, (err, loaihoa) => {
            if (loaihoa) {
                req.flash('warning', 'Category title exists, choose another!');
                res.render('admin/add_category', {
                    title: title,
                });
            } else {
                var loaihoa = new LoaiHoa({
                    slug: slug,
                    title: title
                });

                loaihoa.save((err) => {
                    if (err) return console.log(err);

                    LoaiHoa.find((err, loaihoa) => {
                        if (err) {
                            console.log(err);
                        } else {
                            req.app.locals.loaihoa = loaihoa;
                        }
                    });
                    
                    req.flash('success', 'Loai hoa moi da duoc them');
                    res.redirect('/admin/categories');
                });
            }
        });
    }
});

/* 
* GET edit category
*/
router.get('/edit-category/:id', isAdmin, (req,res) => {
    LoaiHoa.findById(req.params.id, (err,loaihoa) => {
        if (err) return console.log(err);

        res.render('admin/edit_category', {
            title: loaihoa.title,
            id: loaihoa._id
         })
    })
});

/* 
* POST edit category
*/
router.post('/edit-category/:id', isAdmin, (req,res) => {
    req.checkBody('title','Title must have a value').notEmpty();

    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var id = req.params.id;

    var errors = req.validationErrors();

    if(errors) {
        res.render('admin/edit_category', {
            errors: errors,
            title: title,
            id: id 
        });
    } else {
        LoaiHoa.findOne({slug: slug, _id: {'$ne': id}}, (err, loaihoa) => {
            if (loaihoa) {
                req.flash('danger', 'Category title exists, choose another!');
                res.render('admin/edit_category', {
                    title: title,
                    id: id 
                });
            } else {
                LoaiHoa.findById(id, (err,loaihoa) => {
                    if (err) return console.log(err);

                    loaihoa.title = title;
                    loaihoa.slug = slug;

                    loaihoa.save((err) => {
                        if (err) return console.log(err);

                        LoaiHoa.find((err, loaihoa) => {
                            if (err) {
                                console.log(err);
                            } else {
                                req.app.locals.loaihoa = loaihoa;
                            }
                        });
                        
                        req.flash('success', 'Category editted!');
                        res.redirect('/admin/categories/edit-category/' + id);
                    });
                });
            }
        });
    }
});

/* 
* GET delete category
*/
router.get('/delete-category/:id', isAdmin, (req,res) => {
    LoaiHoa.findByIdAndRemove(req.params.id, (err) => {
        if (err) return console.log(err);

        LoaiHoa.find((err, loaihoa) => {
            if (err) {
                console.log(err);
            } else {
                req.app.locals.loaihoa = loaihoa;
            }
        });
        
        req.flash('success', 'Category deleted!');
        res.redirect('/admin/categories');
    })
});

// Exports module
module.exports = router;