let $cmd = <HTMLDivElement>document.querySelector('.window-content').lastElementChild.lastElementChild
const pathPrefix = 'users/louis/root'
let path = 'root', currentTree:string[] = [], index = 0, lastCmds = ['']

let storageCmds = localStorage.getItem('lastCmds')
if (storageCmds !== null) {
    lastCmds = JSON.parse(storageCmds)
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


function getFolder(tree:string[]) {
    let folder = structure.filesystem.root
    for (let i = 0; i < tree.length; i++) {
        const current = tree[i];
        
        folder = folder[current]
    }
    return folder
}

const structure = {
    commands: {
        hello: {
            desc: 'Greets the user',
            func: (path: string, args: string[]) => {
                return 'Hello yourself ;)'
            }
        },
        help: {
            desc: 'a list of all commands',
            func: (path: string, args: string[]) => {
                return `
                <ul>   
                    <li><b>help</b> – a list of all commands</li>
                    <li><b>ls</b> <em>&lt;path&gt;</em> – lists all the contents of the directory</li>
                    <li><b>cd</b> <em>&lt;path&gt;</em> – moves into the directory</li>
                    <li><b>cat</b> <em>&lt;filename&gt;</em> – displays the content of the file</li>
                    <li><b>clear</b> – clears the screen</li>
                    <li><b>path</b> – displays the absolute path</li>
                    <li><b>time</b> – displays the current time</li>
                </ul> `
            }
        },
        clear: {
            desc: 'clears the screen',
            func: (path: string, args: string[]): string => {
                $cmd.parentElement.parentElement.innerHTML = '';
                (<HTMLDivElement>document.querySelector('.window-content')).insertAdjacentHTML('beforeend', `
                    <div class="line">
                        <div></div>
                    </div>
                `)
                $cmd = (<HTMLDivElement>document.querySelector('.window-content').lastElementChild.lastElementChild)
                return ''
            }
        },
        ls: {
            desc: 'lists all the contents of the directory',
            func: (path: string, args: string[]) => {
                args[1] = args[1] ? args[1] : '.'

                const pth = args[1].replace('\n', '').split('/')
                if (pth[0] === '.') {
                    pth.shift()
                }

                let initFS = getFolder(currentTree)

                for (let i = 0; i < pth.length; i++) {
                    if (pth[i] === '.') {
                        pth.shift()
                        continue
                    } else if (!pth[i]) {
                        continue
                    }

                    initFS = initFS[pth[i]]
                    if (typeof initFS !== 'object') {
                        return `<span style="margin-right: 8px;" class="text-error">✘</span> ls: ${args[1]}: no such directory`
                    }
                }

                const contents = Object.keys(initFS)
                let returnString = ``
                for (let i = 0; i < contents.length; i++) {
                    if (contents[i] === 'meta') continue;

                    const element = initFS[contents[i]];
                    
                    if (element && element.meta && element.meta.type === 'folder') {
                        returnString += `<em class="folder">${contents[i]}</em> \t`
                    } else if(element && element.meta && element.meta.type === 'link') {
                        returnString += `<a href="${element.link}" class="link">${contents[i]}</a> \t`
                    } else {
                        returnString += contents[i] + '\t'
                    }
                    

                }

                return returnString
            }
        },
        cd: {
            desc: 'moves into the directory',
            func: (currPath: string, args: string[]) => {
                args[1] = args[1] ? args[1] : path
                if (args[1] === '/') {
                    currFolder = structure.filesystem.root
                    currentTree = []
                    path = 'root'
                    return
                } if (path === args[1]) {
                    return
                }

                const pth:string[] = args[1].replace('\n', '').split('/')

                let initFS = getFolder(currentTree)

                for (let i = 0; i < pth.length; i++) {
                    if (pth[i] === '..') {
                        pth[i] = currentTree.pop()
                        initFS = getFolder(currentTree)
                        continue;
                    } else if (pth[i] === '.') {
                        pth.shift()
                        continue
                    } else if (!pth[i]) {
                        continue
                    }
                    currentTree.push(pth[i])
                    initFS = getFolder(currentTree)
                    if (!initFS) {
                        return `<span style="margin-right: 8px;" class="text-error">✘</span> cd: ${args[1]}: does not exist`
                    } else if (typeof initFS !== 'object' || initFS.meta.type !== 'folder') {
                        currentTree.pop() // remove gibberish element
                        return `<span style="margin-right: 8px;" class="text-error">✘</span> cd: ${args[1]}: not a directory`
                    }
                }
                path = currentTree.length > 0 ? currentTree[currentTree.length-1] : 'root'
            }
        },
        path: {
            desc: 'displays the absolute path',
            func: (path: string, args: string[]) => {
                return `${pathPrefix}/${currentTree.join('/')}`
            }
        },
        mkdir: {
            desc: 'create a directory',
            func: (path: string, args: string[]) => {
                if (args.length === 1) {
                    return `<span style="margin-right: 8px;" class="text-error">✘</span> mkdir: please specify a name.`
                }
                getFolder(currentTree)[args[1].replace('/', '-')] = {
                    meta: {
                        type: 'folder'
                    }
                }
                return `<span style="margin-right: 8px;" class="text-success">✔</span> Success: Directory ${args[1].replace('/', '-')} created.`
            }
        },
        time: {
            desc: 'displays the current time',
            func: (path: string, args: string[]) => {
                let time = new Date(), str:string = ''
                
                if (time.getHours() <= 5) {
                    str += 'Good Night'
                } else if (time.getHours() <= 11) {
                    str += 'Good Morning'
                } else if (time.getHours() <= 15) {
                    str += 'Good Afternoon'
                } else if (time.getHours() <= 17) {
                    str += 'Good Evening'
                }
                str += `! it is: <span class="timer">${time.toLocaleTimeString()}</span>`

                setInterval(() => {
                    document.querySelectorAll('.timer').forEach(timer => {
                        timer.innerHTML = new Date().toLocaleTimeString()
                    })
                }, 1000)

                return str
            }
        },
        cat: {
            desc: 'displays the content of the file',
            func: (path: string, args: string[]) => {
                args[1] = args[1] ? args[1] : undefined

                if (!args[1]) {
                    return `<span style="margin-right: 8px;" class="text-error">✘</span> Error: please specify a path.`
                }

                

                const pth = args[1].replace('\n', '').split('/')
                if (pth[0] === '.') {
                    pth.shift()
                }
                let file = getFolder(pth)

                if (!file && pth.length === 1) {
                    file = getFolder(currentTree.concat(pth))
                }

                if (typeof file === 'object') {
                    
                    if (file.meta.type === 'download') {

                        // initializes automatic download
                        const downloadEL = document.createElement('a')
                        downloadEL.setAttribute('download', file['name'])
                        downloadEL.setAttribute('href', file['link'])
                        downloadEL.click()

                        return `<span style="margin-right: 8px;" class="text-success">✔</span> Success: The download should have started now. <br> Alternatively click <a href="${file['link']}" download="${file["name"]}">here.`
                    } else {
                        return `<span style="margin-right: 8px;" class="text-error">✘</span> Error: /${args[1]} is not a file.`
                    }
                } else if (typeof file !== 'string') {
                    return `<span style="margin-right: 8px;" class="text-error">✘</span> Error: The file /${args[1]} does not exist.`
                } else if (typeof file === 'string') {
                    return file
                }
            }
        },
        notFound: {
            desc: 'prints error message',
            func: (path: string, args: string[]) => {
                return `<span style="margin-right: 8px;" class="text-error">✘</span> Error: command not found: ${args[0]}`
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
                'social_media.rtf': `
                    <h5>Let\'s get in touch...</h5>
                    <div class="sm-icons">
                        <a href="https://codepen.io/Throvn" class="tooltip">
                            <img width="18px" src="https://cdn.worldvectorlogo.com/logos/codepen-icon.svg" alt="codepen logo">
                            <span class="tooltiptext">CodePen</span>
                        </a>
                        <a href="https://www.linkedin.com/in/louis-stanko/" class="tooltip">
                            <img width="18px" src="https://cdn.worldvectorlogo.com/logos/linkedin-icon-2.svg" alt="linkedin logo">
                            <span class="tooltiptext">LinkedIn</span>
                        </a>
                        <a href="https://www.facebook.com/zackchen1337/" class="tooltip">
                            <img width="18px" src="https://cdn.worldvectorlogo.com/logos/facebook-3.svg" alt="facebook logo">
                            <span class="tooltiptext">Facebook</span>
                        </a>
                        <a href="https://www.instagram.com/zackchen07/" class="tooltip">
                            <img width="18px" src="https://cdn.worldvectorlogo.com/logos/instagram-2-1.svg" alt="instagram logo">
                            <span class="tooltiptext">Instagram</span>
                        </a>
                        <a href="mailto:tagnacht4@gmail.com" class="tooltip">
                            <img width="18px" src="https://cdn.worldvectorlogo.com/logos/mail-ios.svg" alt="email logo">
                            <span class="tooltiptext">Email</span>
                        </a>
                    </div>
                `,
                'cv.pdf': {
                    meta: {
                        type: 'download',
                    },
                    link: '../documents/cv.pdf',
                    name: 'CV - Louis Stanko.pdf'
                },
                certificates: {
                    meta: {
                        type: 'folder'
                    },
                    'coursera.pem': `
                        <h5>All my coursera certificates</h5>
                        <ol>
                            <li><a href="https://www.coursera.org/account/accomplishments/certificate/GUJ5EQQUC95A">Mathematics for Machine Learning: Linear Algebra</a></li>
                            <li><a href="https://www.coursera.org/account/accomplishments/verify/967CJAGA27S4">Build a Modern Computer from First Principles: From Nand to Tetris (Project-Centered Course)</a></li>
                        </ol>
                    `,
                    'udemy.pem': `
                        <h5>All my udemy certificates</h5>
                        <ol>
                            <li><a href="https://www.udemy.com/certificate/UC-544f6a3a-d7e0-41e2-b4a9-b72271febe8a/">AWS Certified Solutions Architect - Associate 2020</a></li>
                            <li><a href="https://www.udemy.com/certificate/UC-5VIXX6IJ/">Automate the Boring Stuff with Python</a></li>
                            <li><a href="https://www.udemy.com/certificate/UC-SIWXZYGZ/">The Complete Node.js Developer Course</a></li>
                            <li><a href="http://ude.my/UC-RANVVGS3">Computer Science 101: Master the Theory Behind Programming</a></li>
                            <li><a href="https://www.udemy.com/certificate/UC-U8N3S427/">The Modern JavaScript Bootcamp</a></li>
                        </ol>
                    `,
                    'edx.pem': `
                        <h5>All my edX certificates</h5>
                        <ol>
                            <li><a href="https://courses.edx.org/certificates/ee28c26b78884348afb7eaac7b8c073e">Javascript Fundamentals</a></li>
                        </ol>
                    `,
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
                    link: '/demos/rushhour/index.html',
                },
                chatapp: {
                    meta: {
                        type: 'link'
                    },
                    link: 'https://throvn-chat-app.herokuapp.com/',
                },
                pong: {
                    meta: {
                        type: 'link'
                    },
                    link: '/demos/pong/index.html',
                },
            },
        }
    }
}

let currFolder = structure.filesystem.root, lastFolder = structure.filesystem.root

function checkCommands(rawCmd: string) {
    if (!rawCmd) return;

    rawCmd = rawCmd.replace('\n', '')
    const cmd = rawCmd.split(/ +/g)
    const command = structure.commands[(cmd[0])]


    const result = command ? command.func(path, cmd) : structure.commands['notFound'].func(path, cmd)
    $cmd.parentElement.parentElement.insertAdjacentHTML('beforeend', `<div class="window-response">${result ? result : ''}</div>`)

}

const checkInput = (evt: KeyboardEvent) => {
    $cmd.innerText = $cmd.innerText.replace('\n', '');
    if (evt.key === 'Enter') {

        (<HTMLDivElement>evt.target).removeAttribute('contenteditable')
        const cmd = $cmd.innerText.replace('\n', '')
        checkCommands(cmd) // check for command input
        lastCmds.unshift(cmd)

        // creat new command line
        $cmd.parentElement.parentElement.insertAdjacentHTML('beforeend', `
            <div class="line">
                <span class="pre-input">${path} <b class="pre-divide">❯</b></span>  
                <div class="window-input" contenteditable=""></div>
            </div>
        `)

        // clean up after the old command line
        $cmd = <HTMLDivElement>document.querySelector('.window-content').lastElementChild.lastElementChild
        $cmd.onkeypress = checkInput
        this.removeEventListener('input', checkInput)

        $cmd.focus()

        index = 0 // set the index for last commands back to zero
    } else if (evt.key === 'ArrowUp') { // go through last commands
        if (lastCmds.length > 0 && index+1 <= lastCmds.length) {
            $cmd.innerText = lastCmds[index]
            index += 1
        }
    } else if (evt.key === 'ArrowDown') { // return to last commands
        if (lastCmds.length > 0 && index-1 >= 0) {
            index -= 1
            $cmd.innerText = lastCmds[index]
        }
    }
    placeCaretAtEnd($cmd)
}
$cmd.onkeyup = checkInput

// save last 30 executed commands to local storage
window.onbeforeunload = (evt) => {
    localStorage.setItem('lastCmds', JSON.stringify(lastCmds.slice(0, 30)))
}

document.body.onkeyup = evt => {
    if (evt.key === 'Tab') {
        const tmpInp = $cmd.innerText.replace('\n', '').split(/ +/g)

        if (tmpInp.length === 1) {
            const commandNames = Object.keys(structure.commands)
            const autoComplete = commandNames.filter(name => name.lastIndexOf(tmpInp[0], 0) === 0)
            if (autoComplete.length === 1) {
                $cmd.innerText = autoComplete[0]
            }
        } else if (tmpInp.length === 2) {
            const previousTree = tmpInp[1].split('/') // turn folder structure to array
            if (previousTree[0] === '.') {
                previousTree.shift()
            }

            const searchWord = previousTree.pop() // save the last not yet typed out word
            const autoComplete = Object.keys(getFolder(currentTree.concat(previousTree))) // get all contents of the current directory
                .filter(name => name.lastIndexOf(searchWord, 0) === 0) // search for filenames/directories which start with the searchword
            if (autoComplete.length === 1) { // if only one match was found -> autocomplete
                $cmd.innerText = tmpInp[0] + ' ' + (previousTree[0] ? previousTree.join('/') + '/' : '') + autoComplete[0]
            }
        }

        // focus where the user has left of
        $cmd.focus()
        placeCaretAtEnd($cmd)
    }
}

$cmd.focus()