var express = require('express');
var router = express.Router();
const path = require('path');
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/pdfs/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
})
const upload = multer({ storage: storage });

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/pdf-merge', function (req, res, next) {
  res.render('pdf-merge');
});

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file.mimetype.startsWith('application/pdf')) {
    return res.status(422).json({
      error: 'Hanya file pdf yang di terima'
    });
  }

  return res.status(200).send(req.file);
});

module.exports = router;
