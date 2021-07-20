var express = require('express');
var router = express.Router();
var mkdir = require('mkdirp');
var fs = require('fs-extra');
var resizeImg = require('resize-img');
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

// Load Product model
var Hoa = require('../models/product');

// Load Category model
var LoaiHoa = require('../models/category');

/* 
* GET product index
*/
router.get('/', isAdmin, (req,res) => {
   var count;

   Hoa.count((err, c) => {
       count = c;
   });

   Hoa.find((err, hoas) => {
       res.render('admin/products', {
           hoas: hoas,
           count: count
       });
   });
});

/* 
* GET add product
*/
router.get('/add-product', isAdmin, (req,res) => {
    var title = "";
    var description = "";
    var price = "";

    LoaiHoa.find((err, loaihoas) => {
        res.render('admin/add_product', {
            title: title,
            description: description,
            categories: loaihoas,
            price: price
         });
    })
});

// ========= Chuyen tieng Viet co dau => khong dau
var removeVietnameseTones = (str) => {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str = str.replace(/đ/g,"d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    // Some system encode vietnamese combining accent as individual utf-8 characters
    // Một vài bộ encode coi các dấu mũ, dấu chữ như một kí tự riêng biệt nên thêm hai dòng này
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
    // Remove extra spaces
    // Bỏ các khoảng trắng liền nhau
    str = str.replace(/ + /g," ");
    str = str.trim();
    
    return str;
}
/* 
* POST add product
*/
router.post('/add-product', (req,res) => {

    var imageFile = typeof req.files.image != "undefined" ? req.files.image.name : "";

    req.checkBody('title','Title must have a value').notEmpty();
    req.checkBody('description','Description must have a value').notEmpty();
    req.checkBody('price','Price must have a value').isDecimal();
    req.checkBody('image', 'You must upload an image').isImage(imageFile);

    var title = req.body.title;
    var slug = removeVietnameseTones(title.replace(/\s+/g, '-').toLowerCase());
    var description = req.body.description;
    var price = req.body.price;
    var category = req.body.category;

    var errors = req.validationErrors();

    if(errors) {
        LoaiHoa.find((err, loaihoas) => {
            res.render('admin/add_product', {
                errors: errors,
                title: title,
                description: description,
                categories: loaihoas,
                price: price
             });
        });
    } else {
        Hoa.findOne({slug: slug}, (err, hoa) => {
            if (hoa) {
                req.flash('Danger', 'Product title exists, choose another!');
                LoaiHoa.find((err, loaihoas) => {
                    res.render('admin/add_product', {
                        errors: errors,
                        title: title,
                        description: description,
                        loaihoa: loaihoas,
                        price: price
                     });
                });
            } else {
                var hoa = new Hoa({
                    title: title,
                    slug: slug,
                    description: description,
                    price: price,
                    category: category,
                    image: imageFile
                });

                hoa.save((err) => {
                    if (err) return console.log(err);

                    mkdir('public/product_images/' + hoa._id, (err) => {
                        console.log(err);
                    });

                    mkdir('public/product_images/' + hoa._id + '/gallery', (err) => {
                        console.log(err);
                    });

                    mkdir('public/product_images/' + hoa._id + '/gallery/thumbs', (err) => {
                        console.log(err);
                    });

                    if (imageFile != "") {
                        var hoaImage = req.files.image;
                        var path = 'public/product_images/' + hoa._id + '/' + imageFile;

                        hoaImage.mv(path, (err) => {
                            return console.log(err);
                        })
                    }

                    req.flash('Success', 'Product added.');
                    res.redirect('/admin/products');
                });
            }
        });
    }
});

/* 
* GET edit product
*/
router.get('/edit-product/:id', isAdmin, (req,res) => {

    var errors;

    if (req.session.errors) errors = req.session.errors;
    req.session.errors = null;

    LoaiHoa.find((err, loaihoas) => {

        Hoa.findById(req.params.id, (err, hoa) => {
            if (err) {
                console.log(err);
                res.redireact('/admin/products');
            } else {
                var galleryDir = 'public/product_images/' + hoa._id + '/gallery';
                var galleryImages = null;

                fs.readdir(galleryDir, (err, files) => {
                    if (err) {
                        console.log(err);
                    } else {
                        galleryImages = files;

                        res.render('admin/edit_product', {
                            errors: errors,
                            title: hoa.title,
                            description: hoa.description,
                            categories: loaihoas,
                            category: hoa.category.replace(/\s+/g, '-').toLowerCase(),
                            price: parseFloat(hoa.price),
                            image: hoa.image,
                            galleryImages: galleryImages,
                            id: hoa._id
                         });
                    }
                });
            }
        });
    });
    
});

/* 
* POST edit product
*/
router.post('/edit-product/:id', (req,res) => {

    var imageFile = typeof req.files.image != "undefined" ? req.files.image.name : "";

    req.checkBody('title','Title must have a value').notEmpty();
    req.checkBody('description','Description must have a value').notEmpty();
    req.checkBody('price','Price must have a value').isDecimal();
    req.checkBody('image', 'You must upload an image').isImage(imageFile);

    var title = req.body.title;
    var slug = removeVietnameseTones(title.replace(/\s+/g, '-').toLowerCase());
    var description = req.body.description;
    var price = req.body.price;
    var category = req.body.category;
    var image = req.body.image;
    var id = req.params.id;

    var errors = req.validationErrors();

    if (errors) {
        req.session.errors = errors;
        res.redirect('/admin/products/edit-product' + id);
    } else {
        Hoa.findOne({slug: slug, _id: {'$ne':id}}, (err, hoa) => {
            if (err) {
                console.log(err);
            }
            if (hoa) {
                req.flash('danger', 'Product title exists, choose another!');
                req.redirect('/admin/products/edit-product/' + id);
            } else {
                Hoa.findById(id, (err, hoa) => {
                    if (err) {
                        console.log(err);
                    }

                    hoa.title = title;
                    hoa.slug = slug;
                    hoa.description = description;
                    hoa.price = parseFloat(price);
                    if (imageFile != "") {
                        hoa.image = imageFile;
                    }

                    hoa.save((err) => {
                        if (err) {
                            console.log(err);
                        }

                        if (imageFile != "") {
                            if (image != "") {
                                fs.remove('public/product_images/' + id + '/' + image, (err) => {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            }

                            var hoaImage = req.files.image;
                            var path = 'public/product_images/' + id + '/' + imageFile;

                            hoaImage.mv(path, (err) => {
                            return console.log(err);
                            });
                        }

                        req.flash('Success', 'Product edited.');
                        res.redirect('/admin/products/edit-product/' + id);
                    });
                })
            }
        })
    }
});

/* 
* POST product gallery
*/
router.post('/product-gallery/:id', (req,res) => {
    
    var hoaImage = req.files.file;
    var id = req.params.id;
    var path = 'public/product_images/' + id + '/gallery' + req.files.file.name;
    var thumbsPath = 'public/product_images/' + id + '/gallery/thumbs' + req.files.file.name;

    hoaImage.mv(path, (err) => {
        if (err) {
            console.log(err);
        }

        resizeImg(fs.readFileSync(path), {width:100, height:100}).then((buf) => {
            fs.writeFileSync(thumbsPath, buf);
        });
    });

    res.sendStatus(200);
});

/* 
* GET delete image
*/
router.get('/delete-image/:image', isAdmin, (req,res) => {
    var originalImage = 'public/product_images/' + req.query.id + '/gallery' + req.params.image;
    var thumbImage = 'public/product_images/' + req.query.id + '/gallery/thumbs/' + req.params.image;

    fs.remove(originalImage, (err) => {
        if (err) {
            console.log(err);
        } else {
            fs.remove(thumbImage, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    req.flash('success', 'Image deleted.');
                    res.redirect('/admin/products/edit-product/' + req.query.id);
                }
            });
        }
    })
});

/* 
* GET delete product
*/
router.get('/delete-product/:id', isAdmin, (req,res) => {
    
    var id = req.params.id;
    var path = 'public/product_images/' + id;

    fs.remove(path, (err) => {
        if (err) {
            console.log(err);
        } else {
            Hoa.findByIdAndRemove(id, (err) => {
                if (err) {
                    console.log(err);
                }
            });

            req.flash('success', 'Product deleted.');
            res.redirect('/admin/products');
        }
    });
});

// Exports module
module.exports = router;