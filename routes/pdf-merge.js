const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const PDFMerge = require('pdf-merge');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/pdfs/')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({storage: storage});

router.get('/pdf-merge', function (req, res) {
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

    res.json(req.body);
});

router.post('/process', async function (req, res, next) {
    if(req.body.length) {
        const files = req.body.map(d => path.join(__dirname, '../public/pdfs', d));
        const filename = `result-${Date.now()}.pdf`;
        const filepath = path.join(__dirname, '../public/pdfs/', filename);

        try {
            await PDFMerge(files, { output: filepath });
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
        })
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
