var _this = this;
var $cmd = document.querySelector('.window-content').lastElementChild.lastElementChild;
var CMDs = /** @class */ (function () {
    /**
     * Handles all of the possible commands
     * @param initialCommands {object} commands which should be initialized at the beginning
     */
    function CMDs(initialCommands) {
        this.commands = {};
        this.history = [''];
        var storageCmds = localStorage.getItem('lastCmds');
        if (storageCmds !== null) {
            this.history = JSON.parse(storageCmds);
        }
        if (initialCommands) {
            this.commands = initialCommands;
        }
    }
    /**
     * Add a new command to the interface
     * @param name 'wakeword' of the command
     * @param backend function which handles the logic and arguments passed after the execution
     * @param description (optional) short description of what your program does
     */
    CMDs.prototype.add = function (name, backend, description) {
        this.commands[name] = {
            func: backend,
            desc: description || ''
        };
    };
    /**
     * Get all commands
     */
    CMDs.prototype.all = function () {
        return this.commands;
    };
    /**
     * get all command names
     */
    CMDs.prototype.keys = function () {
        return Object.keys(this.commands);
    };
    /**
     * get the object of the programm
     * @param name command name
     * @returns {object} the function and description of your programm
     */
    CMDs.prototype.find = function (name) {
        return this.commands[name];
    };
    return CMDs;
}());
var Commands = new CMDs({
    hello: {
        desc: 'Greets the user',
        func: function (path, args) {
            return 'Hello yourself ;)';
        }
    },
    help: {
        desc: 'a list of all commands',
        func: function (path, args) {
            return "\n            <em>Never used a terminal before? Visit my old site <a href=\"https://throvn.github.io/old\">here</a>.</em>\n            <ul>   \n                <li><b>help</b> \u2013 a list of all commands</li>\n                <li><b>ls</b> <em>&lt;path&gt;</em> \u2013 lists all the contents of the directory</li>\n                <li><b>cd</b> <em>&lt;path&gt;</em> \u2013 moves into the directory</li>\n                <li><b>cat</b> <em>&lt;filename&gt;</em> \u2013 displays the content of the file</li>\n                <li><b>clear</b> \u2013 clears the screen</li>\n                <li><b>path</b> \u2013 displays the absolute path</li>\n                <li><b>time</b> \u2013 displays the current time</li>\n            </ul> ";
        }
    },
    clear: {
        desc: 'clears the screen',
        func: function (path, args) {
            $cmd.parentElement.parentElement.innerHTML = '';
            document.querySelector('.window-content').insertAdjacentHTML('beforeend', "\n                <div class=\"line\">\n                    <div></div>\n                </div>\n            ");
            $cmd = document.querySelector('.window-content').lastElementChild.lastElementChild;
            return '';
        }
    },
    ls: {
        desc: 'lists all the contents of the directory',
        func: function (path, args) {
            args[1] = args[1] ? args[1] : '.';
            var pth = args[1].replace('\n', '').split('/');
            if (pth[0] === '.') {
                pth.shift();
            }
            var initFS = fs.getFolder(fs.activeDirectory);
            for (var i = 0; i < pth.length; i++) {
                if (pth[i] === '.') {
                    pth.shift();
                    continue;
                }
                else if (!pth[i]) {
                    continue;
                }
                initFS = initFS[pth[i]];
                if (typeof initFS !== 'object') {
                    return "<span style=\"margin-right: 8px;\" class=\"text-error\">\u2718</span> ls: " + args[1] + ": no such directory";
                }
            }
            var contents = Object.keys(initFS);
            var returnString = "";
            for (var i = 0; i < contents.length; i++) {
                if (contents[i] === 'meta')
                    continue;
                var element = initFS[contents[i]];
                if (element && element.meta && element.meta.type === 'folder') {
                    returnString += "<em class=\"folder\">" + contents[i] + "</em> \t";
                }
                else if (element && element.meta && element.meta.type === 'link') {
                    returnString += "<a href=\"" + element.link + "\" class=\"link\">" + contents[i] + "</a> \t";
                }
                else {
                    returnString += contents[i] + '\t';
                }
            }
            return returnString;
        }
    },
    cd: {
        desc: 'moves into the directory',
        func: function (currPath, args) {
            args[1] = args[1] ? args[1] : fs.displayPath;
            if (args[1] === '/') {
                currFolder = fs.root;
                fs.activeDirectory = new Path([]);
                fs.displayPath = 'root';
                return;
            }
            if (fs.displayPath === args[1]) {
                return;
            }
            var pth = (new Path(args[1].replace('\n', '')));
            var initFS = fs.getFolder(fs.activeDirectory);
            for (var i = 0; i < pth.toObject().length; i++) {
                if (pth.find(i) === '..') {
                    pth.toObject()[i] = fs.activeDirectory.pop();
                    initFS = fs.getFolder(fs.activeDirectory);
                    continue;
                }
                else if (pth.find(i) === '.') {
                    pth.shift();
                    continue;
                }
                else if (!pth.find(i)) {
                    continue;
                }
                fs.activeDirectory.push(pth.find(i));
                initFS = fs.getFolder(fs.activeDirectory);
                if (!initFS) {
                    return "<span style=\"margin-right: 8px;\" class=\"text-error\">\u2718</span> cd: " + args[1] + ": does not exist";
                }
                else if (typeof initFS !== 'object' || initFS.meta.type !== 'folder') {
                    fs.activeDirectory.pop(); // remove gibberish element
                    return "<span style=\"margin-right: 8px;\" class=\"text-error\">\u2718</span> cd: " + args[1] + ": not a directory";
                }
            }
            fs.displayPath = fs.activeDirectory.toObject().length > 0 ? fs.activeDirectory.toObject()[fs.activeDirectory.toObject().length - 1] : 'root';
        }
    },
    path: {
        desc: 'displays the absolute path',
        func: function (path, args) {
            return fs.pathPrefix + "/" + fs.activeDirectory.toString();
        }
    },
    mkdir: {
        desc: 'create a directory',
        func: function (path, args) {
            if (args.length === 1) {
                return "<span style=\"margin-right: 8px;\" class=\"text-error\">\u2718</span> mkdir: please specify a name.";
            }
            fs.getFolder(fs.activeDirectory)[args[1].replace('/', '-')] = {
                meta: {
                    type: 'folder'
                }
            };
            return "<span style=\"margin-right: 8px;\" class=\"text-success\">\u2714</span> Success: Directory " + args[1].replace('/', '-') + " created.";
        }
    },
    time: {
        desc: 'displays the current time',
        func: function (path, args) {
            var time = new Date(), str = '';
            if (time.getHours() <= 5) {
                str += 'Good Night';
            }
            else if (time.getHours() <= 11) {
                str += 'Good Morning';
            }
            else if (time.getHours() <= 15) {
                str += 'Good Afternoon';
            }
            else if (time.getHours() <= 17) {
                str += 'Good Evening';
            }
            str += "! it is: <span class=\"timer\">" + time.toLocaleTimeString() + "</span>";
            setInterval(function () {
                document.querySelectorAll('.timer').forEach(function (timer) {
                    timer.innerHTML = new Date().toLocaleTimeString();
                });
            }, 1000);
            return str;
        }
    },
    cat: {
        desc: 'displays the content of the file',
        func: function (path, args) {
            args[1] = args[1] ? args[1] : undefined;
            if (!args[1]) {
                return "<span style=\"margin-right: 8px;\" class=\"text-error\">\u2718</span> Error: please specify a path.";
            }
            var pth = args[1].replace('\n', '').split('/');
            console.log(pth);
            if (pth[0] === '.') {
                pth.shift();
            }
            var file = fs.getFolder(pth);
            if (!file && pth.length === 1) {
                file = fs.getFolder(fs.activeDirectory.concat(pth));
            }
            console.log(file, fs.activeDirectory.concat(pth), fs.getFolder(fs.activeDirectory.concat(pth)));
            if (typeof file === 'object') {
                console.log(true, file.meta.type);
                if (file.meta.type === 'download') {
                    // initializes automatic download
                    var downloadEL = document.createElement('a');
                    downloadEL.setAttribute('download', file['name']);
                    downloadEL.setAttribute('href', file['link']);
                    downloadEL.click();
                    return "<span style=\"margin-right: 8px;\" class=\"text-success\">\u2714</span> Success: The download should have started now. <br> Alternatively click <a href=\"" + file['link'] + "\" download=\"" + file["name"] + "\">here.";
                }
                else {
                    console.log(file);
                    return "<span style=\"margin-right: 8px;\" class=\"text-error\">\u2718</span> Error: /" + args[1] + " is not a file.";
                }
            }
            else if (typeof file !== 'string') {
                return "<span style=\"margin-right: 8px;\" class=\"text-error\">\u2718</span> Error: The file /" + args[1] + " does not exist.";
            }
            else if (typeof file === 'string') {
                return file;
            }
        }
    },
    notFound: {
        desc: 'prints error message',
        func: function (path, args) {
            return "<span style=\"margin-right: 8px;\" class=\"text-error\">\u2718</span> Error: command not found: " + args[0];
        }
    }
});
var Path = /** @class */ (function () {
    function Path(path) {
        this.value = [];
        this.length = 0;
        var valid;
        switch (typeof path) {
            case 'string':
                this.value = path.trim().split('/');
                valid = true;
                break;
            case 'object':
                if (Array.isArray(path)) {
                    this.value = path;
                    valid = true;
                }
                break;
        }
        if (!valid) {
            throw new Error(path + " is not a path.");
        }
        this.length = this.value.length;
    }
    Path.prototype.toString = function () {
        return this.value.join('/');
    };
    Path.prototype.toObject = function () {
        return this.value;
    };
    Path.prototype.concat = function (lastPath) {
        if (!Array.isArray(lastPath)) {
            lastPath = lastPath.toObject();
        }
        return this.value.concat(lastPath);
    };
    Path.prototype.pop = function () {
        return this.value.pop();
    };
    Path.prototype.push = function (directoryName) {
        return this.value.push(directoryName);
    };
    Path.prototype.shift = function () {
        return this.value.shift();
    };
    Path.prototype.find = function (index) {
        return this.value[index];
    };
    return Path;
}());
var index = 0;
var Filesystem = /** @class */ (function () {
    function Filesystem() {
        // Starting directory
        this.activeDirectory = new Path([]);
        // the folder name in green in front of the caret
        this.displayPath = 'root';
        this.pathPrefix = 'users/louis/root'; // just for good looking purposes (for the path command)
        this.root = {
            meta: {
                type: 'folder'
            },
            'README.md': '<h2 class="text-error">## Welcome to my homepage!</h2> I\'m Louis. <br> You will find lots of stuff about me here. <br> Who I am, what I do and what my hobbies are. <br><br> Want to see the <code><a target="_blank" href="https://github.com/Throvn">\`source code\`</a></code> ? <br> <br> This project is open source and has a modular structure... feel free to contribute, or fork! <br><br>',
            about_me: {
                meta: {
                    type: 'folder'
                },
                'me.png': '<h5><img width="250px" src="https://throvn.github.io/img/me-circle.webp" /></h5>',
                'social_media.rtf': "\n                <h5>Let's get in touch...</h5>\n                <div class=\"sm-icons\">\n                    <a href=\"https://codepen.io/Throvn\" class=\"tooltip\">\n                        <img width=\"18px\" src=\"https://cdn.worldvectorlogo.com/logos/codepen-icon.svg\" alt=\"codepen logo\">\n                        <span class=\"tooltiptext\">CodePen</span>\n                    </a>\n                    <a href=\"https://www.linkedin.com/in/louis-stanko/\" class=\"tooltip\">\n                        <img width=\"18px\" src=\"https://cdn.worldvectorlogo.com/logos/linkedin-icon-2.svg\" alt=\"linkedin logo\">\n                        <span class=\"tooltiptext\">LinkedIn</span>\n                    </a>\n                    <a href=\"https://www.facebook.com/zackchen1337/\" class=\"tooltip\">\n                        <img width=\"18px\" src=\"https://cdn.worldvectorlogo.com/logos/facebook-3.svg\" alt=\"facebook logo\">\n                        <span class=\"tooltiptext\">Facebook</span>\n                    </a>\n                    <a href=\"https://www.instagram.com/zackchen07/\" class=\"tooltip\">\n                        <img width=\"18px\" src=\"https://cdn.worldvectorlogo.com/logos/instagram-2-1.svg\" alt=\"instagram logo\">\n                        <span class=\"tooltiptext\">Instagram</span>\n                    </a>\n                    <a href=\"mailto:tagnacht4@gmail.com\" class=\"tooltip\">\n                        <img width=\"18px\" src=\"https://cdn.worldvectorlogo.com/logos/mail-ios.svg\" alt=\"email logo\">\n                        <span class=\"tooltiptext\">Email</span>\n                    </a>\n                </div>\n            ",
                'cv.pdf': {
                    meta: {
                        type: 'download'
                    },
                    link: '../documents/cv.pdf',
                    name: 'CV - Louis Stanko.pdf'
                },
                'languages.hbs': "<h5>Languages</h5> \n                        <small>German</small>\n                        <div class=\"progressbar-container\">\n                            <div class=\"progressbar-inside lang-german\"></div>\n                        </div> <br> <small>English</small>\n                        <div class=\"progressbar-container\">\n                            <div class=\"progressbar-inside lang-english\"></div>\n                        </div> <br>",
                certificates: {
                    meta: {
                        type: 'folder'
                    },
                    'coursera.pem': "\n                    <h5>All my coursera certificates</h5>\n                    <ol>\n                        <li><a href=\"https://www.coursera.org/account/accomplishments/certificate/GUJ5EQQUC95A\">Mathematics for Machine Learning: Linear Algebra</a></li>\n                        <li><a href=\"https://www.coursera.org/account/accomplishments/verify/967CJAGA27S4\">Build a Modern Computer from First Principles: From Nand to Tetris (Project-Centered Course)</a></li>\n                    </ol>\n                ",
                    'udemy.pem': "\n                    <h5>All my udemy certificates</h5>\n                    <ol>\n                        <li><a href=\"https://www.udemy.com/certificate/UC-544f6a3a-d7e0-41e2-b4a9-b72271febe8a/\">AWS Certified Solutions Architect - Associate 2020</a></li>\n                        <li><a href=\"https://www.udemy.com/certificate/UC-5VIXX6IJ/\">Automate the Boring Stuff with Python</a></li>\n                        <li><a href=\"https://www.udemy.com/certificate/UC-SIWXZYGZ/\">The Complete Node.js Developer Course</a></li>\n                        <li><a href=\"http://ude.my/UC-RANVVGS3\">Computer Science 101: Master the Theory Behind Programming</a></li>\n                        <li><a href=\"https://www.udemy.com/certificate/UC-U8N3S427/\">The Modern JavaScript Bootcamp</a></li>\n                    </ol>\n                ",
                    'edx.pem': "\n                    <h5>All my edX certificates</h5>\n                    <ol>\n                        <li><a href=\"https://courses.edx.org/certificates/ee28c26b78884348afb7eaac7b8c073e\">Javascript Fundamentals</a></li>\n                    </ol>\n                "
                }
            },
            projects: {
                meta: {
                    type: 'folder'
                },
                'skills.txt': "\n                <h3><svg width=\"1em\" height=\"1em\" viewBox=\"0 0 16 16\" class=\"bi bi-bookmark-star-fill\" fill=\"currentColor\" xmlns=\"http://www.w3.org/2000/svg\">\n                <path fill-rule=\"evenodd\" d=\"M4 0a2 2 0 0 0-2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4zm4.16 4.1a.178.178 0 0 0-.32 0l-.634 1.285a.178.178 0 0 1-.134.098l-1.42.206a.178.178 0 0 0-.098.303L6.58 6.993c.042.041.061.1.051.158L6.39 8.565a.178.178 0 0 0 .258.187l1.27-.668a.178.178 0 0 1 .165 0l1.27.668a.178.178 0 0 0 .257-.187L9.368 7.15a.178.178 0 0 1 .05-.158l1.028-1.001a.178.178 0 0 0-.098-.303l-1.42-.206a.178.178 0 0 1-.134-.098L8.16 4.1z\"/>\n              </svg> My Skills</h3>\n                <table>\n                    <thead>\n                        <tr><u><h5>Web Development</h5></u></tr>\n                        <tr>\n                            <td>Frontend</td>\n                            <td>Backend</td>\n                        </tr>\n                    </thead>\n                    <tbody>\n                        <tr>\n                            <td>\n                                HTML\n                            </td>\n                            <td>\n                                Node.js\n                            </td>\n                        </tr>\n                        <tr>\n                            <td>\n                                CSS\n                            </td>\n                            <td>\n                                MongoDB\n                            </td>\n                        </tr>\n                        <tr>\n                            <td>\n                                JavaScript\n                            </td>\n                            <td>\n                                Express.js\n                            </td>\n                        </tr>\n                        <tr>\n                            <td>\n                                Vue.js\n                            </td>\n                            <td>\n                                \n                            </td>\n                        </tr>\n                        <tr>\n                            <td><u><h5>App Development</h5></u></td>\n                            <td><u><h5>Other Languages</h5></u></td>\n                        </tr>\n                        <tr>\n                            <td>\n                                Swift\n                            </td>\n                            <td>\n                                Python\n                            </td>\n                        </tr>\n                        <tr>\n                            <td>\n                            React Native (JS)    \n                            </td>\n                            <td>GoLang</td>\n                        </tr>\n                    </tbody>\n                </table>\n            ",
                rushhour: {
                    meta: {
                        type: 'link'
                    },
                    link: '/demos/rushhour/index.html'
                },
                chatapp: {
                    meta: {
                        type: 'link'
                    },
                    link: 'https://throvn-chat-app.herokuapp.com/'
                },
                pong: {
                    meta: {
                        type: 'link'
                    },
                    link: '/demos/pong/index.html'
                }
            }
        };
    }
    /**
     * if all of the parameters exist, return the right path
     * @param name string to check if not empty
     * @param contents check if not falsy
     * @param path check if path exists
     */
    Filesystem.prototype.getPath = function (name, contents, path) {
        if (!name || !contents) {
            return null;
        }
        else if (!path) {
            return this.root;
        }
        else if (this.getFolder(path)) {
            return this.getFolder(path);
        }
        return null;
    };
    /**
     * Gets the folder at the path
     * @returns the contents of the folder on the specified path
     * @param path path to visit
     */
    Filesystem.prototype.getFolder = function (path) {
        if (Array.isArray(path)) {
            path = new Path(path);
        }
        var folder = this.root;
        for (var i = 0; i < path.toObject().length; i++) {
            var current = path.toObject()[i];
            folder = folder[current];
        }
        return folder;
    };
    /**
     * adds a file to the emulated filesystem
     * @param name name of the file (with ending [dots are allowed])
     * @param contents html string of the contents of the file
     * @param path absolute path of the file location
     */
    Filesystem.prototype.addFile = function (name, contents, path) {
        var currPath = this.getPath(name, contents, path);
        if (currPath) {
            currPath[name] = contents;
        }
    };
    /**
     * Adds a new object to the filesystem
     * @param name file/folder name
     * @param contents contents of the file/folder
     * @param path where the file/folder should be stored
     * @throws Error if one of the parameters is falsy
     */
    Filesystem.prototype.addCustom = function (name, contents, path) {
        if (contents === void 0) { contents = { meta: { type: 'folder|download|link|custom' } }; }
        if (!name || !contents || !contents.meta || !contents.meta.type || typeof contents.meta.type !== 'string' || !path) {
            throw new Error("Check your file syntax");
        }
        else {
            this.getFolder(path)[name] = contents;
        }
    };
    return Filesystem;
}());
var Helper = /** @class */ (function () {
    function Helper() {
    }
    /**
     * Places the cursor at the end of the element
     * @author Tim Down (https://stackoverflow.com/questions/4233265/contenteditable-set-caret-at-the-end-of-the-text-cross-browser)
     * @param el Element where the caret should be at the last position
     */
    Helper.placeCaretAtEnd = function (el) {
        el.focus();
        if (typeof window.getSelection != "undefined"
            && typeof document.createRange != "undefined") {
            var range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    };
    return Helper;
}());
var fs = new Filesystem();
var currFolder = fs.root, lastFolder = fs.root;
/**
 * parses the user input and calles the corresponding functions
 * @param rawCmd user input
 */
function checkCommands(rawCmd) {
    if (!rawCmd)
        return;
    rawCmd = rawCmd.replace('\n', '');
    var cmd = rawCmd.split(/ +/g);
    var command = Commands.all()[cmd[0]];
    var result = command ? command.func(fs.activeDirectory, cmd) : Commands.find('notFound').func(fs.activeDirectory, cmd);
    $cmd.parentElement.parentElement.insertAdjacentHTML('beforeend', "<div class=\"window-response\">" + (result ? result : '') + "</div>");
}
/**
 * checks if the user typed something into the input bar
 * @param evt Keyboard event
 */
var checkInput = function (evt) {
    console.log($cmd.innerText);
    console.log(evt.key);
    if (evt.key === 'Enter') {
        evt.target.removeAttribute('contenteditable');
        var cmd = $cmd.innerText.replace('\n', ' ');
        checkCommands(cmd); // check for command input
        Commands.history.unshift(cmd);
        // creat new command line
        $cmd.parentElement.parentElement.insertAdjacentHTML('beforeend', "\n            <div class=\"line\">\n                <span class=\"pre-input\">" + fs.displayPath + " <b class=\"pre-divide\">\u276F</b></span>  \n                <div class=\"window-input\" contenteditable=\"\"></div>\n            </div>\n        ");
        // clean up after the old command line
        $cmd = document.querySelector('.window-content').lastElementChild.lastElementChild;
        $cmd.onkeypress = checkInput;
        _this.removeEventListener('input', checkInput);
        $cmd.focus();
        Helper.placeCaretAtEnd($cmd);
        index = 0; // set the index for last commands back to zero
    }
    else if (evt.key === 'ArrowUp') { // go through last commands
        if (Commands.history.length > 0 && index + 1 <= Commands.history.length) {
            $cmd.innerText = Commands.history[index];
            index += 1;
            Helper.placeCaretAtEnd($cmd);
        }
    }
    else if (evt.key === 'ArrowDown') { // return to last commands
        if (Commands.history.length > 0 && index - 1 >= 0) {
            index -= 1;
            $cmd.innerText = Commands.history[index];
            Helper.placeCaretAtEnd($cmd);
        }
    }
    else {
        //automatically transforms the first character to lowercase (mobile devices write the first letter uppercase)
        if ($cmd.innerText.charAt(0) === $cmd.innerText.charAt(0).toUpperCase()) {
            $cmd.innerText = $cmd.innerText.charAt(0).toLowerCase() + $cmd.innerText.substr(1);
            Helper.placeCaretAtEnd($cmd);
            $cmd.focus();
        }
    }
};
$cmd.onkeyup = checkInput;
// save last 30 executed commands to local storage
window.onbeforeunload = function (evt) {
    localStorage.setItem('lastCmds', JSON.stringify(Commands.history.slice(0, 30)));
};
/**
 * handles the autocomplete process
 * @param evt KeyboardEvent
 */
document.body.onkeyup = function (evt) {
    if (evt.key === 'Tab') {
        var tmpInp_1 = $cmd.innerText.replace('\n', '').split(/ +/g);
        if (tmpInp_1.length === 1) {
            var commandNames = Commands.keys();
            var autoComplete = commandNames.filter(function (name) { return name.lastIndexOf(tmpInp_1[0], 0) === 0; });
            if (autoComplete.length === 1) {
                $cmd.innerText = autoComplete[0];
                Helper.placeCaretAtEnd($cmd);
            }
        }
        else if (tmpInp_1.length === 2) {
            var previousTree = tmpInp_1[1].split('/'); // turn folder structure to array
            if (previousTree[0] === '.') {
                previousTree.shift();
            }
            var searchWord_1 = previousTree.pop(); // save the last not yet typed out word
            var autoComplete = Object.keys(fs.getFolder(fs.activeDirectory.concat(previousTree))) // get all contents of the current directory
                .filter(function (name) { return name.lastIndexOf(searchWord_1, 0) === 0; }); // search for filenames/directories which start with the searchword
            if (autoComplete.length === 1) { // if only one match was found -> autocomplete
                $cmd.innerText = tmpInp_1[0] + ' ' + (previousTree[0] ? previousTree.join('/') + '/' : '') + autoComplete[0];
                Helper.placeCaretAtEnd($cmd);
            }
        }
        // focus where the user has left of
        $cmd.focus();
    }
};
$cmd.focus();
