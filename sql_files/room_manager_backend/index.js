// require('./packages_api_controller/package_manager');
const express = require('express');
const multer = require('multer');


const OwnersController = require('./owners_api_controller/owners_controller');
const app = express();
const upload = multer({ dest: 'uploads/' }); 
app.use(express.json());
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

//owners
app.get('/owners', OwnersController.getAllbuisness_owners);
app.post('/addBusinessOwner', upload.fields([
    { name: 'documentFront', maxCount: 1 },
    { name: 'documentBack', maxCount: 1 },
]), OwnersController.addBusinessOwner);
app.put('/owners/:id', OwnersController.updateBuisnessOwner);
app.delete('/owners/:id', OwnersController.deleteBuisnessOwner);