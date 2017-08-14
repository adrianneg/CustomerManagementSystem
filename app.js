var express = require('express'),
    mysql = require('mysql'),
    app = express(),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    cookieSession = require('cookie-session'),
    flash = require('express-flash'),
    fileUpload = require('express-fileupload'),
    path = require('path');

var db = mysql.createConnection({
  host: "127.0.0.1",
  user: "",
  password: "",
  database: ""
});

db.connect(function(err) {
  if (err) throw err;
  console.log("Mysql Connected!");
});

//app configurations
app.set('trust proxy', 1) // trust first proxy
// app.use(express.static(__dirname + '../public'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/public/views');
app.use(express.static('public'))

// to support JSON-encoded bodies
app.use( bodyParser.json() );
// to support URL-encoded bodies
app.use(bodyParser.urlencoded({  extended: true }));
app.use(cookieParser('keyboard cat'));
app.use(cookieSession({ name: 'session', keys:['key1', "key2"], maxAge: 60000 }))
app.use(flash());
app.use(fileUpload());

//DISPLAY CUSTOMER VIEW
app.get('/customer/:id', function (req, res) {
  message = req.flash('info');
  db.query("SELECT * FROM customers WHERE id = ?", [req.params.id], function(err, results, fields){
      if(err){
        throw err;
      }

      if(results.length == 0){
        res.redirect("/");
        return;
      }

      results = results ? results[0] : {};
      res.render('customer/view',{title:"View Customer", customer: results, message: message});
  });
});

//DISPLAY UPDATE CUSTOMER VIEW
app.get('/update/:id', function (req, res) {
  db.query("SELECT * FROM customers WHERE id = ?", [req.params.id], function(err, results, fields){
      if(err){
        throw err;
      }
      results = results ? results[0] : {};
      res.render('customer/update',{title:"Update Customer", customer: results, message: ""});
  });
});

// HANDLE UPDATE OF CUSTOMER
app.post('/update/:id', function (req, res) {
  // console.log(req.files);
  if(req.files && req.files.editimage){
      imgData = req.files.editimage.data.toString('base64');
      imageName = req.files.editimage.name;
      ext = path.extname(imageName);
  }else{
    imgData = null;
    imageName = "";
    ext = "";
  }
  var customer = { name : req.body.name, address : req.body.address, image: imgData, photoname: imageName, fileext : ext};
  if(imgData == null){
    delete customer.image;
  }
  if(imageName == ""){
    delete customer.photoname;
  }
  if(ext == ""){
    delete customer.fileext;
  }
  db.query("UPDATE customers SET ? WHERE id = ?", [customer, req.params.id], function(err, results, fields){
      if(err){
        throw err;
      }
      req.flash('info', 'Customer record successfully updated');
      res.redirect("/customer/"+req.params.id);
  });
});

//DISPLAY CREATE CUSTOMER VIEW
app.get('/create', function(req, res){
  message = req.flash('info') ;
 	res.render('customer/create',{title:"Create Customer", messages: message});
});

// HANDLE CREATION OF CUSTOMER
app.post('/create', function(req, res){
  if(req.files){
    imgData = req.files.cusimage.data.toString('base64');
    imageName = req.files.cusimage.name;
    ext = path.extname(imageName);
  }else{
    imgData = null;
    imageName = "";
    ext = "";
  }
  var customer = { name : req.body.name, address : req.body.address, image: imgData, photoname: imageName, fileext : ext};
  //insert into db
  db.query("INSERT INTO customers SET ?", customer, function(err, results){
      if(err){
        throw err;
      }

      if(results.affectedRows > 0){
        // console.log(results);
        req.flash('info', 'Customer record successfully created');
        res.redirect("/customer/"+results.insertId);
        return;
      }

      res.redirect("/create");
  });

});

//DELETE THE CUSTOMER BASED ON ID
app.post('/delete/:id', function(req, res){
  //insert into db
  db.query("DELETE FROM customers WHERE id =  ?", [req.params.id], function(err, results){
      if(err){
        throw err;
      }

      if(results.affectedRows <= 0){
        res.redirect("/customer/"+req.params.id);
        return;
      }
      req.flash('info', 'Customer record successfully deleted');
      res.redirect("/");
  });

});

//DISPLAY ALL CUSTOMER VIEW
app.get('/:q?', function (req, res) {
  var message = req.flash('info');
  var search = req.query.q, all = 1;

  if(search == null || search == ""){
    search = "";
  }else{
    search = search.trim();
    all = 0;
  }
  db.query("SELECT * FROM customers WHERE name LIKE ? OR address LIKE ? OR id = ? OR 1 = ? ORDER BY id DESC",
              ["%"+search+"%", "%"+search+"%", search, all],
          function(err, results, fields){
    if(err){
      throw err;
    }
    // console.log(results);
    res.render('index', { title:"All Customers", customers: results,
                          message: message, rcount:results.length,
                          query: search  });
  });
});

app.listen(3000);
console.log("Listening on port " + 3000)
