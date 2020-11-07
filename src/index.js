var _this = this;
var $cmd = document.querySelector('.window-content').lastElementChild.lastElementChild;
var pathPrefix = 'users/louis/root';
var path = 'root', currentTree = [], index = 0, lastCmds = [''];
var storageCmds = localStorage.getItem('lastCmds');
if (storageCmds !== null) {
    lastCmds = JSON.parse(storageCmds);
}
// Helper function by https://stackoverflow.com/questions/4233265/contenteditable-set-caret-at-the-end-of-the-text-cross-browser
function placeCaretAtEnd(el) {
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
}
function getFolder(tree) {
    var folder = structure.filesystem.root;
    for (var i = 0; i < tree.length; i++) {
        var current = tree[i];
        folder = folder[current];
    }
    return folder;
}
var structure = {
    commands: {
        hello: {
            desc: 'Greets the user',
            func: function (path, args) {
                return 'Hello yourself ;)';
            }
        },
        help: {
            desc: 'a list of all commands',
            func: function (path, args) {
                return "\n                <ul>   \n                    <li><b>help</b> \u2013 a list of all commands</li>\n                    <li><b>ls</b> <em>&lt;path&gt;</em> \u2013 lists all the contents of the directory</li>\n                    <li><b>cd</b> <em>&lt;path&gt;</em> \u2013 moves into the directory</li>\n                    <li><b>cat</b> <em>&lt;filename&gt;</em> \u2013 displays the content of the file</li>\n                    <li><b>clear</b> \u2013 clears the screen</li>\n                    <li><b>path</b> \u2013 displays the absolute path</li>\n                    <li><b>time</b> \u2013 displays the current time</li>\n                </ul> ";
            }
        },
        clear: {
            desc: 'clears the screen',
            func: function (path, args) {
                $cmd.parentElement.parentElement.innerHTML = '';
                document.querySelector('.window-content').insertAdjacentHTML('beforeend', "\n                    <div class=\"line\">\n                        <div></div>\n                    </div>\n                ");
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
                var initFS = getFolder(currentTree);
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
                args[1] = args[1] ? args[1] : path;
                if (args[1] === '/') {
                    currFolder = structure.filesystem.root;
                    currentTree = [];
                    path = 'root';
                    return;
                }
                if (path === args[1]) {
                    return;
                }
                var pth = args[1].replace('\n', '').split('/');
                var initFS = getFolder(currentTree);
                for (var i = 0; i < pth.length; i++) {
                    if (pth[i] === '..') {
                        pth[i] = currentTree.pop();
                        initFS = getFolder(currentTree);
                        continue;
                    }
                    else if (pth[i] === '.') {
                        pth.shift();
                        continue;
                    }
                    else if (!pth[i]) {
                        continue;
                    }
                    currentTree.push(pth[i]);
                    initFS = getFolder(currentTree);
                    if (!initFS) {
                        return "<span style=\"margin-right: 8px;\" class=\"text-error\">\u2718</span> cd: " + args[1] + ": does not exist";
                    }
                    else if (typeof initFS !== 'object' || initFS.meta.type !== 'folder') {
                        currentTree.pop(); // remove gibberish element
                        return "<span style=\"margin-right: 8px;\" class=\"text-error\">\u2718</span> cd: " + args[1] + ": not a directory";
                    }
                }
                path = currentTree.length > 0 ? currentTree[currentTree.length - 1] : 'root';
            }
        },
        path: {
            desc: 'displays the absolute path',
            func: function (path, args) {
                return pathPrefix + "/" + currentTree.join('/');
            }
        },
        mkdir: {
            desc: 'create a directory',
            func: function (path, args) {
                if (args.length === 1) {
                    return "<span style=\"margin-right: 8px;\" class=\"text-error\">\u2718</span> mkdir: please specify a name.";
                }
                getFolder(currentTree)[args[1].replace('/', '-')] = {
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
                if (pth[0] === '.') {
                    pth.shift();
                }
                var file = getFolder(pth);
                if (!file && pth.length === 1) {
                    file = getFolder(currentTree.concat(pth));
                }
                if (typeof file === 'object') {
                    if (file.meta.type === 'download') {
                        // initializes automatic download
                        var downloadEL = document.createElement('a');
                        downloadEL.setAttribute('download', file['name']);
                        downloadEL.setAttribute('href', file['link']);
                        downloadEL.click();
                        return "<span style=\"margin-right: 8px;\" class=\"text-success\">\u2714</span> Success: The download should have started now. <br> Alternatively click <a href=\"" + file['link'] + "\" download=\"" + file["name"] + "\">here.";
                    }
                    else {
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
    },
    filesystem: {
        root: {
            meta: {
                type: 'folder'
            },
            'README.md': '<h2 class="text-error">##Welcome to my homepage!</h2> I\'m Louis. <br> You will find lots of stuff about me here. <br> Who I am, what I do and what my hobbies are. <br><br> Want to see the <code><a target="_blank" href="https://github.com/Throvn">\`source code\`</a></code> ? <br> <br> This project is open source and has a modular structure... feel free to contribute, or fork! <br><br>',
            about_me: {
                meta: {
                    type: 'folder'
                },
                'me.png': '<h5><img width="250px" src="https://throvn.github.io/img/me-circle.webp" /></h5>',
                'social_media.rtf': "\n                    <h5>Let's get in touch...</h5>\n                    <div class=\"sm-icons\">\n                        <a href=\"https://codepen.io/Throvn\" class=\"tooltip\">\n                            <img width=\"18px\" src=\"https://cdn.worldvectorlogo.com/logos/codepen-icon.svg\" alt=\"codepen logo\">\n                            <span class=\"tooltiptext\">CodePen</span>\n                        </a>\n                        <a href=\"https://www.linkedin.com/in/louis-stanko/\" class=\"tooltip\">\n                            <img width=\"18px\" src=\"https://cdn.worldvectorlogo.com/logos/linkedin-icon-2.svg\" alt=\"linkedin logo\">\n                            <span class=\"tooltiptext\">LinkedIn</span>\n                        </a>\n                        <a href=\"https://www.facebook.com/zackchen1337/\" class=\"tooltip\">\n                            <img width=\"18px\" src=\"https://cdn.worldvectorlogo.com/logos/facebook-3.svg\" alt=\"facebook logo\">\n                            <span class=\"tooltiptext\">Facebook</span>\n                        </a>\n                        <a href=\"https://www.instagram.com/zackchen07/\" class=\"tooltip\">\n                            <img width=\"18px\" src=\"https://cdn.worldvectorlogo.com/logos/instagram-2-1.svg\" alt=\"instagram logo\">\n                            <span class=\"tooltiptext\">Instagram</span>\n                        </a>\n                        <a href=\"mailto:tagnacht4@gmail.com\" class=\"tooltip\">\n                            <img width=\"18px\" src=\"https://cdn.worldvectorlogo.com/logos/mail-ios.svg\" alt=\"email logo\">\n                            <span class=\"tooltiptext\">Email</span>\n                        </a>\n                    </div>\n                ",
                'cv.pdf': {
                    meta: {
                        type: 'download'
                    },
                    link: '../documents/cv.pdf',
                    name: 'CV - Louis Stanko.pdf'
                },
                certificates: {
                    meta: {
                        type: 'folder'
                    },
                    'coursera.pem': "\n                        <h5>All my coursera certificates</h5>\n                        <ol>\n                            <li><a href=\"https://www.coursera.org/account/accomplishments/certificate/GUJ5EQQUC95A\">Mathematics for Machine Learning: Linear Algebra</a></li>\n                            <li><a href=\"https://www.coursera.org/account/accomplishments/verify/967CJAGA27S4\">Build a Modern Computer from First Principles: From Nand to Tetris (Project-Centered Course)</a></li>\n                        </ol>\n                    ",
                    'udemy.pem': "\n                        <h5>All my udemy certificates</h5>\n                        <ol>\n                            <li><a href=\"https://www.udemy.com/certificate/UC-544f6a3a-d7e0-41e2-b4a9-b72271febe8a/\">AWS Certified Solutions Architect - Associate 2020</a></li>\n                            <li><a href=\"https://www.udemy.com/certificate/UC-5VIXX6IJ/\">Automate the Boring Stuff with Python</a></li>\n                            <li><a href=\"https://www.udemy.com/certificate/UC-SIWXZYGZ/\">The Complete Node.js Developer Course</a></li>\n                            <li><a href=\"http://ude.my/UC-RANVVGS3\">Computer Science 101: Master the Theory Behind Programming</a></li>\n                            <li><a href=\"https://www.udemy.com/certificate/UC-U8N3S427/\">The Modern JavaScript Bootcamp</a></li>\n                        </ol>\n                    ",
                    'edx.pem': "\n                        <h5>All my edX certificates</h5>\n                        <ol>\n                            <li><a href=\"https://courses.edx.org/certificates/ee28c26b78884348afb7eaac7b8c073e\">Javascript Fundamentals</a></li>\n                        </ol>\n                    "
                }
            },
            projects: {
                meta: {
                    type: 'folder'
                },
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
        }
    }
};
var currFolder = structure.filesystem.root, lastFolder = structure.filesystem.root;
function checkCommands(rawCmd) {
    if (!rawCmd)
        return;
    rawCmd = rawCmd.replace('\n', '');
    var cmd = rawCmd.split(/ +/g);
    var command = structure.commands[(cmd[0])];
    var result = command ? command.func(path, cmd) : structure.commands['notFound'].func(path, cmd);
    $cmd.parentElement.parentElement.insertAdjacentHTML('beforeend', "<div class=\"window-response\">" + (result ? result : '') + "</div>");
}
var checkInput = function (evt) {
    $cmd.innerText = $cmd.innerText.replace('\n', '');
    if (evt.key === 'Enter') {
        evt.target.removeAttribute('contenteditable');
        var cmd = $cmd.innerText.replace('\n', '');
        checkCommands(cmd); // check for command input
        lastCmds.unshift(cmd);
        // creat new command line
        $cmd.parentElement.parentElement.insertAdjacentHTML('beforeend', "\n            <div class=\"line\">\n                <span class=\"pre-input\">" + path + " <b class=\"pre-divide\">\u276F</b></span>  \n                <div class=\"window-input\" contenteditable=\"\"></div>\n            </div>\n        ");
        // clean up after the old command line
        $cmd = document.querySelector('.window-content').lastElementChild.lastElementChild;
        $cmd.onkeypress = checkInput;
        _this.removeEventListener('input', checkInput);
        $cmd.focus();
        index = 0; // set the index for last commands back to zero
    }
    else if (evt.key === 'ArrowUp') { // go through last commands
        if (lastCmds.length > 0 && index + 1 <= lastCmds.length) {
            $cmd.innerText = lastCmds[index];
            index += 1;
        }
    }
    else if (evt.key === 'ArrowDown') { // return to last commands
        if (lastCmds.length > 0 && index - 1 >= 0) {
            index -= 1;
            $cmd.innerText = lastCmds[index];
        }
    }
    placeCaretAtEnd($cmd);
};
$cmd.onkeyup = checkInput;
// save last 30 executed commands to local storage
window.onbeforeunload = function (evt) {
    localStorage.setItem('lastCmds', JSON.stringify(lastCmds.slice(0, 30)));
};
document.body.onkeyup = function (evt) {
    if (evt.key === 'Tab') {
        var tmpInp_1 = $cmd.innerText.replace('\n', '').split(/ +/g);
        if (tmpInp_1.length === 1) {
            var commandNames = Object.keys(structure.commands);
            var autoComplete = commandNames.filter(function (name) { return name.lastIndexOf(tmpInp_1[0], 0) === 0; });
            if (autoComplete.length === 1) {
                $cmd.innerText = autoComplete[0];
            }
        }
        else if (tmpInp_1.length === 2) {
            var previousTree = tmpInp_1[1].split('/'); // turn folder structure to array
            if (previousTree[0] === '.') {
                previousTree.shift();
            }
            var searchWord_1 = previousTree.pop(); // save the last not yet typed out word
            var autoComplete = Object.keys(getFolder(currentTree.concat(previousTree))) // get all contents of the current directory
                .filter(function (name) { return name.lastIndexOf(searchWord_1, 0) === 0; }); // search for filenames/directories which start with the searchword
            if (autoComplete.length === 1) { // if only one match was found -> autocomplete
                $cmd.innerText = tmpInp_1[0] + ' ' + (previousTree[0] ? previousTree.join('/') + '/' : '') + autoComplete[0];
            }
        }
        // focus where the user has left of
        $cmd.focus();
        placeCaretAtEnd($cmd);
    }
};
$cmd.focus();
