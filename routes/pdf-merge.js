const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const PDFMerger = require('pdf-merger-js');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/pdfs/')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({storage: storage});

router.get('/', function (req, res) {
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

router.post('/delete', (req, res) => {
    if (req.body.length) {
        req.body.forEach(function (e) {
            try {
                fs.unlinkSync(path.join(__dirname, '../public/pdfs', e));
            }catch (e) {
                console.log(e.message);
                return res.json({
                    status: false,
                    message: e.message
                })
            }
        });
    }

    res.json({
        status: true,
        message: 'Successfully'
    });
});


router.post('/process', async function(req, res, next) {
   const request = req.body;
   if(request.data.length) {
       const files = request.data.map(d => ({...d, filename : path.join(__dirname, '../public/pdfs', d.filename)}));
       const filename = `${request.namafile}.pdf`;
       const filepath = path.join(__dirname, '../public/pdfs/', filename);

        try {
            const merger = new PDFMerger();
            for (const file of files) {
                console.log(file);
                if(file.pages !== '') {
                    await merger.add(file.filename, file.pages);
                }else {
                    await merger.add(file.filename);
                }
            }

            await merger.save(filepath);
        }catch (e) {
            next(e);
            return res.json({
                status: false,
                message: e.message
            });
        }

       const fileinfo = fs.statSync(filepath);
       return res.json({
           status: true,
           message: {
               filename: filename,
               size: fileinfo.size,
               originalname: filename
           }
       });
   }
});

router.get('/download/:filename', function (req, res) {
    if(req.params.filename) {
        const filepath = path.join(__dirname, '../public/pdfs/', req.params.filename);
        res.download(filepath, function (err) {
            if(err) console.log(err);

            fs.unlinkSync(filepath);
        })
    }
})

module.exports = router;
