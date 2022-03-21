var express = require('express');
const axios = require('axios');

const JSONdb = require('simple-json-db');
const db = new JSONdb('./user.json');

var path = require('path');
var mienv = require('dotenv').config();



var Finance = require('financejs');
var finance = new Finance();

var moment = require('moment');
moment.locale('es');

var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// const Telegraf = require('telegraf');
// const tbot = new Telegraf('5057044668:AAEUf9uJ26NgILXUXlIuo3X779JhRRC2t-k');

const nodemailer = require("nodemailer");
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'info@hondaprada.com.bo', // generated ethereal user
    pass: 'password', // generated ethereal password
  },
});

// const webpush = require("./webpush");
// let pushSubscripton;


//------------  RAIZ -------------------------------------------------
app.get('/', (req, res) => {
  // var urli = process.env.API+'lw_phone';
  
  res.render('index', {title: 'Proformas' });
});
//------------  RAIZ -------------------------------------------------


//------------  NOTIFICATIONS -------------------------------------------------
// app.post('/subscription', async (req, res) => {
//   pushSubscripton = req.body;
//   // console.log(pushSubscripton);
//   const payload = JSON.stringify({
//     title: "My Custom Notification",
//     message: "Hola Mundo"
//   });
//   // res.status(201).json();
//   await webpush.sendNotification(pushSubscripton, payload);
// });
//------------  NOTIFICATIONS -------------------------------------------------



//------------- PROFORMAS ---------------------------------------
app.get('/allproformas', (req, res) => {

  axios.get(process.env.API+'lw_proformas')
    .then(function (response) {
      res.render('allproformas', { midata: response.data, moment: moment });
    });
});
app.get('/proforma', (req, res) => {

  axios.get(process.env.API+'lw_proforma?id='+req.query.id)
    .then(function (response) {
     
      res.render('proforma', { midata: response.data, midata2: JSON.stringify(response.data), moment: moment });
    });
});
//------------- PROFORMAS ---------------------------------------




// app.get('/allreservas', (req, res) => {

//   axios.get(process.env.API+'lw_reservas')
//     .then(function (response) {
//       res.render('allproformas', { data: response.data });
//     });
// });
app.get('/help', (req, res) => {

  res.render('help');
});
app.get('/cotizador', (req, res) => {

  if (req.query.user) {
    // const payload = JSON.stringify({
    //   title: "My Custom Notification",
    //   message: "Hola Mundo"
    // });
    // await webpush.sendNotification(pushSubscripton, payload);
    
    var products;
    var user;
    axios.get(process.env.API+'lw_user?user='+req.query.user)
      .then(function (response) {

        user = response.data;
        axios.get(process.env.API+'lw_products')
          .then(function (response) {
            products = response.data;
            db.set(req.query.user, {id: user.id, first_name: user.nombre, last_name: user.apellido, phone: user.billing_phone });
            res.render('cotizador', { products: products, user: user });
          });
      });
  } else {
    res.render('index', { title: 'Login' });
  }
});

app.get('/calcular', function(req, res, next) {
  if (process.env.SPAM) {
      // axios.get(process.env.CHATBOT+'?type=text&phone=76886773&message=Se registro una nueva proformas la puedes var aqui:\n'+process.env.DOMAIN+'cotizador?user='+req.query.user_id)
      // .then(function (response) {
  
      // });
      // axios.get(process.env.CHATBOT+'?type=text&phone=59172846519&message=Se registro una nueva proformas la puedes var aqui:')
      // .then(function (response) {
       
      // });
      // axios.get(process.env.CHATBOT+'?type=text&phone=72849189&message=Se registro una nueva proformas la puedes var aqui:')
      // .then(function (response) {
       
      // });
      // axios.get(process.env.CHATBOT+'?type=text&phone=72849882&message=Se registro una nueva proformas la puedes var aqui:')
      // .then(function (response) {
       
      // });
    }

  axios.get(process.env.API+'lw_phone?phone='+req.query.phone+'&first_name='+req.query.first_name+'&last_name='+req.query.last_name+'&email='+req.query.email)
  .then(function (response) {
    var user = response.data;
    axios.get(process.env.API+'lw_product?item='+req.query.product_id)
    .then(function (result) {
      var product = result.data;
      var miprice = product.regular_price;
      var mp = miprice-req.query.inicial;
      var pm = req.query.plazo; 
      var am = finance.AM(mp, 36, pm, 1);
      var mitable = [];
      var saldo_inicial = 0;
      // var proforma_id = result.data.proforma_id;
      for (let i = 0; i <= pm ; i++) {
        if (i==0) {
          saldo_inicial = mp;
        } else {
          var interes = saldo_inicial * 0.030;
          var abono_capital = am-interes;
          var saldo_final = saldo_inicial-abono_capital;
          mitable.push({periodo: i, saldo_inicial: saldo_inicial, cuota_fija: am, interes: interes, abono_capital: abono_capital, saldo_final: saldo_final});
          saldo_inicial = saldo_final;
        }
      }
      axios.get(process.env.API+'lw_proforma_create?customer='+user.id+'&plazo='+req.query.plazo+'&inicial='+req.query.inicial+'&product='+req.query.product_id+'&product_price='+product.regular_price+'&product_name='+product.name+'&cuota_fija='+am+'&plan='+JSON.stringify(mitable)+'&vendedor='+req.query.vendedor)
        .then(function (response) {
          console.log(response);
          if (response.data.lw_status) {
            let proforma_id = response.data.proforma_id;
            let vendedor = db.get(req.query.vendedor )
            let setting = {inicial: req.query.inicial, plazo: req.query.plazo, proforma: proforma_id, proforma_num: response.data.num, namebot: process.env.NAMEBOT, number: process.env.NUMBER  };
            res.render('calcular', { midata: product, setting: setting, mitable: mitable, user: user, vendedor: vendedor});
          } else {
            res.send('error');
          }
   
        });
    });
  });
});

app.get('/reservar', (req, res) => {

  axios.get(process.env.API+'lw_reserva_create?customer='+req.query.customer+'&product='+req.query.product+'&monto='+req.query.monto)
  .then(function (response) {
    res.render('reservar', { data: response.data, user_id: req.query.user_id });
  });
});

app.listen(process.env.PORT, () => {
	console.log('COTIZADOR CORRIENDO EN '+process.env.DOMAIN);
});