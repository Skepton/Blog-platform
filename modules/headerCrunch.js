var lwip = require('lwip'),
    fs = require('fs');

module.exports.mainCrunch = function(filename){
    
    var newFile = filename.substr(0, filename.lastIndexOf(".")) + ".jpg";
    
    lwip.open(filename, function(err, image){
        
        if(!err){
        
            image.cover(800,800, function(err, image){
                
                var newPath = newFile.replace('_header', '_8x8');
                
                image.toBuffer('jpg', function(err, buffer){
                
                    fs.writeFile(newPath, buffer, function (err) {
                        
                        if(err) {
                            console.log(err);
                        }
                    });
                
                });
                
            });
        
        }else {
            console.log(err);
        }
        
    });
    
    lwip.open(filename, function(err, image){
        
        if(!err){
        
            image.cover(400,400, function(err, image){
                
                var newPath = newFile.replace('_header', '_4x4');
                
                image.toBuffer('jpg', function(err, buffer){
                
                    fs.writeFile(newPath, buffer, function (err) {
                        
                        if(err) {
                            console.log(err);
                        }
                    });
                
                });
                
            });
        
        }else {
            console.log(err);
        }
        
    });
    
    lwip.open(filename, function(err, image){
        
        if(!err){
        
            image.cover(600,300, function(err, image){
                
                var newPath = newFile.replace('_header', '_4x2');
                
                image.toBuffer('jpg', function(err, buffer){
                
                    fs.writeFile(newPath, buffer, function (err) {
                        
                        if(err) {
                            console.log(err);
                        }
                    });
                
                });
                
            });
        
        }else {
            console.log(err);
        }
        
    });
    
}