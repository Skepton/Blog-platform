var lwip = require('lwip'),
    fs = require('fs');

module.exports.articleCrunch = function(filename){
    
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

module.exports.profileCrunch = function(filename, callback){
    
    lwip.open(filename, function(err, image){
        
        var orig_image = image;
        
        if (!err){
        
            orig_image.cover(300,300, function(err, image){
                
                image.toBuffer('jpg', function(err, buffer){
                
                    fs.writeFile(filename, buffer, function (err) {
                        
                        if(err) {
                            console.log(err);
                            callback(false);
                        }else {
                            callback(true);
                        }
                        
                        orig_image.cover(100,100, function(err, image){
                
                            var path = filename.replace('_profile','10x10');
                            
                            image.toBuffer('jpg', function(err, buffer){
                            
                                fs.writeFile(path, buffer, function (err) {
                                    
                                    if(err) {
                                        console.log(err);
                                    }
                                });
                            
                            });
                            
                        });
                    });
                    
                });
                
            });
        
        } else {
            console.log(err);
        }
        
    });
}