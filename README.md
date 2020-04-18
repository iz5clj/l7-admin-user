<p align="center"><img src="https://res.cloudinary.com/auxe/image/upload/v1584899634/auxe/auxeBlack220x51_gqqucy.png" width="200"></p>

## Install

+ git clone this repo in the directory of your choice. Or make a repo from this template.
+ `composer install` will install all necessary packages in *vendor* directory.
+ Because I am using *clockwork*, inside the *storage* directory, create a *clockwork* directory and `chmod 775 storage/clockwork`. this directory shoud be already created.
+ `chmod -R 775 databse/ storage/` will give apache the write permissions to thos 2 directories.
+ If you use *SqLite*, `touch database/database.sqlite` will create an empty file. 
+ `chmod 775 database/database.sqlite` will give write permissions to apache to use this file.
+ ~~In my case I also give 775 to *public/assets/images* directory because my app store the avatar images in that directory. This is maybe      something to change in the future, and use the storage directory with a symlink.~~
+ `php artisan storage:link` will create 2 symlinks in the public directory:  
    + avatar -> storage/app/public/assets/images/avatar/
    + storage ->  storage/app/public/
+ Check that the file `storage/app/public//assets/images/avatar/default.png` exists.    
+ In the file `webpack.mix.js` change the *proxy* variable with your desired url.
+ run `npm install` to install all the necessary *js* and *css* libraries.
+ Create a new `.env` file, or create it from copying the existing `.env.example`.
+ run `php artisan ide-helper:generate`. Necessary for your editor to recognize all the classes and functions.  
Reload your editor if it is opened.
+ Run this command to generate a key for Laravel's encrypter: `php artisan key:generate`.
+ `php artisan migrate:refresh --seed` to create the tables in the database and seed some users.
+ If you are working in a Windows environement update your `hosts` file with correct settings: domain name and ip.
+ If you are working in a mixed environement (linux+windows) update the `hosts` file in linux also.
+ Choose wich icons to use: *Fontawesome* or *Google icons*.

+ The bootstrap version of the auth package from laravel has already been downloaded and installed. [Laravel docs](https://laravel.com/docs/7.x/authentication#included-routing)

## TODO

+ Where to store avatar images?  
~~All the logic behind the storage and check,~~  
~~Check if it is a goof idea to make it nullable in database tables~~  
~~Where to store the files? in the storage directory.~~  
