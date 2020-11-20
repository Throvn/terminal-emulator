let $cmd = <HTMLDivElement>document.querySelector('.window-content').lastElementChild.lastElementChild


class CMDs {
    private commands: object = {}
    public history: string[] = ['']

    /**
     * Handles all of the possible commands
     * @param initialCommands {object} commands which should be initialized at the beginning
     */
    constructor(initialCommands: object) {
        let storageCmds = localStorage.getItem('lastCmds')
        if (storageCmds !== null) {
            this.history = JSON.parse(storageCmds)
        }

        if (initialCommands) {
            this.commands = initialCommands
        }
    }

    /**
     * Add a new command to the interface
     * @param name 'wakeword' of the command
     * @param backend function which handles the logic and arguments passed after the execution
     * @param description (optional) short description of what your program does
     */
    public add(name: string, backend: (path: Path, args: string[]) => {}, description: string): void {
        this.commands[name] = {
            func: backend,
            desc: description || ''
        }
    }

    /**
     * Get all commands
     */
    public all(): object {
        return this.commands
    }

    /**
     * get all command names
     */
    public keys(): string[] {
        return Object.keys(this.commands)
    }

    /**
     * get the object of the programm
     * @param name command name
     * @returns {object} the function and description of your programm
     */
    public find(name: string) {
        return this.commands[name]
    }
}
const Commands = new CMDs({
    hello: {
        desc: 'Greets the user',
        func: (path: Path, args: string[]) => {
            return 'Hello yourself ;)'
        }
    },
    help: {
        desc: 'a list of all commands',
        func: (path: Path, args: string[]) => {
            return `
            <em>Never used a terminal before? Visit my old site <a href="https://throvn.github.io/old">here</a>.</em>
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
        func: (path: Path, args: string[]): string => {
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
        func: (path: Path, args: string[]) => {
            args[1] = args[1] ? args[1] : '.'

            const pth = args[1].replace('\n', '').split('/')
            if (pth[0] === '.') {
                pth.shift()
            }

            let initFS = fs.getFolder(fs.activeDirectory)

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
                } else if (element && element.meta && element.meta.type === 'link') {
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
        func: (currPath: Path, args: string[]) => {
            args[1] = args[1] ? args[1] : fs.displayPath
            if (args[1] === '/') {
                currFolder = fs.root
                fs.activeDirectory = new Path([])
                fs.displayPath = 'root'
                return
            } if (fs.displayPath === args[1]) {
                return
            }

            const pth: Path = (new Path(args[1].replace('\n', '')))

            let initFS = fs.getFolder(fs.activeDirectory)

            for (let i = 0; i < pth.toObject().length; i++) {
                if (pth.find(i) === '..') {
                    pth.toObject()[i] = fs.activeDirectory.pop()
                    initFS = fs.getFolder(fs.activeDirectory)
                    continue;
                } else if (pth.find(i) === '.') {
                    pth.shift()
                    continue
                } else if (!pth.find(i)) {
                    continue
                }
                fs.activeDirectory.push(pth.find(i))
                initFS = fs.getFolder(fs.activeDirectory)
                if (!initFS) {
                    return `<span style="margin-right: 8px;" class="text-error">✘</span> cd: ${args[1]}: does not exist`
                } else if (typeof initFS !== 'object' || initFS.meta.type !== 'folder') {
                    fs.activeDirectory.pop() // remove gibberish element
                    return `<span style="margin-right: 8px;" class="text-error">✘</span> cd: ${args[1]}: not a directory`
                }
            }
            fs.displayPath = fs.activeDirectory.toObject().length > 0 ? fs.activeDirectory.toObject()[fs.activeDirectory.toObject().length - 1] : 'root'
        }
    },
    path: {
        desc: 'displays the absolute path',
        func: (path: Path, args: string[]) => {
            return `${fs.pathPrefix}/${fs.activeDirectory.toString()}`
        }
    },
    mkdir: {
        desc: 'create a directory',
        func: (path: Path, args: string[]) => {
            if (args.length === 1) {
                return `<span style="margin-right: 8px;" class="text-error">✘</span> mkdir: please specify a name.`
            }
            fs.getFolder(fs.activeDirectory)[args[1].replace('/', '-')] = {
                meta: {
                    type: 'folder'
                }
            }
            return `<span style="margin-right: 8px;" class="text-success">✔</span> Success: Directory ${args[1].replace('/', '-')} created.`
        }
    },
    time: {
        desc: 'displays the current time',
        func: (path: Path, args: string[]) => {
            let time = new Date(), str: string = ''

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
        func: (path: Path, args: string[]) => {
            args[1] = args[1] ? args[1] : undefined

            if (!args[1]) {
                return `<span style="margin-right: 8px;" class="text-error">✘</span> Error: please specify a path.`
            }

            const pth = args[1].replace('\n', '').split('/')
            console.log(pth)
            if (pth[0] === '.') {
                pth.shift()
            }
            let file = fs.getFolder(pth)

            if (!file && pth.length === 1) {
                file = fs.getFolder(fs.activeDirectory.concat(pth))
            }
            console.log(file, fs.activeDirectory.concat(pth), fs.getFolder(fs.activeDirectory.concat(pth)))

            if (typeof file === 'object') {
                console.log(true, file.meta.type)
                if (file.meta.type === 'download') {

                    // initializes automatic download
                    const downloadEL = document.createElement('a')
                    downloadEL.setAttribute('download', file['name'])
                    downloadEL.setAttribute('href', file['link'])
                    downloadEL.click()

                    return `<span style="margin-right: 8px;" class="text-success">✔</span> Success: The download should have started now. <br> Alternatively click <a href="${file['link']}" download="${file["name"]}">here.`
                } else {
                    console.log(file)
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
})

class Path {
    private value: string[] = []
    public length: number = 0

    /**
     * Creates a path object
     * @param path {string|string[]} path to save
     */
    constructor(path: any) {
        let valid: boolean
        switch (typeof path) {
            case 'string':
                this.value = path.trim().split('/')
                valid = true
                break;
            case 'object':
                if (Array.isArray(path)) {
                    this.value = path
                    valid = true
                }
                break;
        }
        if (!valid) {
            throw new Error(`${path} is not a path.`)
        }
        this.length = this.value.length
    }

    /**
     * Gives you the path as a / delimited string
     * @returns {string} the relative path
     */
    public toString():string {
        return this.value.join('/')
    }

    /**
     * Gives the path as an array
     * @returns {string[]} the path as a string[]
     */
    public toObject():string[] {
        return this.value
    }

    /**
     * Merges two paths
     * @param lastPath path to append
     * @returns {string[]} the concatinated array
     */
    public concat(lastPath: Path | string[]): string[] {
        if (!Array.isArray(lastPath)) {
            lastPath = lastPath.toObject()
        }
        return this.value.concat(lastPath)
    }

    /**
     * Removes the last element from the path
     * @returns the removed pathname
     */
    public pop(): string {
        return this.value.pop()
    }

    /**
     * Adds one directory
     * @param directoryName the directory to append
     * @returns {number} the number of directories the path includes
     */
    public push(directoryName: string): number {
        return this.value.push(directoryName)
    }

    /**
     * Removes the first directory from the path
     * @returns the removed directory
     */
    public shift(): string {
        return this.value.shift()
    }

    /**
     * Gives you the name of the directory at the given index
     * @param index number of the directory
     * @returns name of the directory
     */
    public find(index: number): string {
        return this.value[index]
    }
}
let index = 0

class Filesystem {
    
    // Starting directory
    public activeDirectory: Path = new Path([])

    // the folder name in green in front of the caret
    public displayPath = 'root'
    public pathPrefix = 'users/louis/root' // just for good looking purposes (for the path command)
    public root = {
        meta: {
            type: 'folder'
        },
        'README.md': '<h2 class="text-error">## Welcome to my homepage!</h2> I\'m Louis. <br> You will find lots of stuff about me here. <br> Who I am, what I do and what my hobbies are. <br><br> Want to see the <code><a target="_blank" href="https://github.com/Throvn">\`source code\`</a></code> ? <br> <br> This project is open source and has a modular structure... feel free to contribute, or fork! <br><br>',
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
            'languages.hbs': `<h5>Languages</h5> 
                        <small>German</small>
                        <div class="progressbar-container">
                            <div class="progressbar-inside lang-german"></div>
                        </div> <br> <small>English</small>
                        <div class="progressbar-container">
                            <div class="progressbar-inside lang-english"></div>
                        </div> <br>`,
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
            'skills.txt': `
                <h3><svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-bookmark-star-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M4 0a2 2 0 0 0-2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4zm4.16 4.1a.178.178 0 0 0-.32 0l-.634 1.285a.178.178 0 0 1-.134.098l-1.42.206a.178.178 0 0 0-.098.303L6.58 6.993c.042.041.061.1.051.158L6.39 8.565a.178.178 0 0 0 .258.187l1.27-.668a.178.178 0 0 1 .165 0l1.27.668a.178.178 0 0 0 .257-.187L9.368 7.15a.178.178 0 0 1 .05-.158l1.028-1.001a.178.178 0 0 0-.098-.303l-1.42-.206a.178.178 0 0 1-.134-.098L8.16 4.1z"/>
              </svg> My Skills</h3>
                <table>
                    <thead>
                        <tr><u><h5>Web Development</h5></u></tr>
                        <tr>
                            <td>Frontend</td>
                            <td>Backend</td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                HTML
                            </td>
                            <td>
                                Node.js
                            </td>
                        </tr>
                        <tr>
                            <td>
                                CSS
                            </td>
                            <td>
                                MongoDB
                            </td>
                        </tr>
                        <tr>
                            <td>
                                JavaScript
                            </td>
                            <td>
                                Express.js
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Vue.js
                            </td>
                            <td>
                                
                            </td>
                        </tr>
                        <tr>
                            <td><u><h5>App Development</h5></u></td>
                            <td><u><h5>Other Languages</h5></u></td>
                        </tr>
                        <tr>
                            <td>
                                Swift
                            </td>
                            <td>
                                Python
                            </td>
                        </tr>
                        <tr>
                            <td>
                            React Native (JS)    
                            </td>
                            <td>GoLang</td>
                        </tr>
                    </tbody>
                </table>
            `,
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

    /**
     * if all of the parameters exist, return the right path
     * @param name string to check if not empty
     * @param contents check if not falsy
     * @param path check if path exists
     */
    private getPath(name: string, contents: string, path: Path):any {
        if (!name || !contents) {
            return null
        } else if (!path) {
            return this.root
        } else if (this.getFolder(path)) {
            return this.getFolder(path)
        }
        return null
    }

    /**
     * Gets the folder at the path
     * @returns the contents of the folder on the specified path
     * @param path path to visit
     */
    public getFolder(path: Path | string[]):any {
        if (Array.isArray(path)) {
            path = new Path(path)
        }
        let folder = this.root
        for (let i = 0; i < path.toObject().length; i++) {
            const current = path.toObject()[i];
            folder = folder[current]
        }
        return folder
    }

    /**
     * adds a file to the emulated filesystem
     * @param name name of the file (with ending [dots are allowed])
     * @param contents html string of the contents of the file
     * @param path absolute path of the file location
     */
    public addFile(name: string, contents: string, path: Path):void {
        const currPath = this.getPath(name, contents, path)
        if (currPath) {
            currPath[name] = contents
        }
    }

    /**
     * Adds a new object to the filesystem
     * @param name file/folder name
     * @param contents contents of the file/folder
     * @param path where the file/folder should be stored
     * @throws Error if one of the parameters is falsy
     */
    public addCustom(name: string, contents = { meta: { type: 'folder|download|link|custom' } }, path: Path):void {
        if (!name || !contents || !contents.meta || !contents.meta.type || typeof contents.meta.type !== 'string' || !path) {
            throw new Error("Check your file syntax");
        } else {
            this.getFolder(path)[name] = contents
        }
    }
}


class Helper {
    /**
     * Places the cursor at the end of the element
     * @author Tim Down (https://stackoverflow.com/questions/4233265/contenteditable-set-caret-at-the-end-of-the-text-cross-browser)
     * @param el Element where the caret should be at the last position
     */
    static placeCaretAtEnd(el: HTMLElement): void {
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
}

const fs = new Filesystem()

let currFolder = fs.root, lastFolder = fs.root

/**
 * parses the user input and calles the corresponding functions
 * @param rawCmd user input
 */
function checkCommands(rawCmd: string) {
    if (!rawCmd) return;

    rawCmd = rawCmd.replace('\n', '')
    const cmd = rawCmd.split(/ +/g)
    const command = Commands.all()[cmd[0]]


    const result = command ? command.func(fs.activeDirectory, cmd) : Commands.find('notFound').func(fs.activeDirectory, cmd)
    $cmd.parentElement.parentElement.insertAdjacentHTML('beforeend', `<div class="window-response">${result ? result : ''}</div>`)

}

/**
 * checks if the user typed something into the input bar
 * @param evt Keyboard event
 */
const checkInput = (evt: KeyboardEvent) => {
    console.log($cmd.innerText)
    console.log(evt.key)
    if (evt.key === 'Enter') {

        (<HTMLDivElement>evt.target).removeAttribute('contenteditable')
        const cmd = $cmd.innerText.replace('\n', ' ')
        checkCommands(cmd) // check for command input
        Commands.history.unshift(cmd)

        // creat new command line
        $cmd.parentElement.parentElement.insertAdjacentHTML('beforeend', `
            <div class="line">
                <span class="pre-input">${fs.displayPath} <b class="pre-divide">❯</b></span>  
                <div class="window-input" contenteditable=""></div>
            </div>
        `)

        // clean up after the old command line
        $cmd = <HTMLDivElement>document.querySelector('.window-content').lastElementChild.lastElementChild
        $cmd.onkeypress = checkInput
        this.removeEventListener('input', checkInput)

        $cmd.focus()
        Helper.placeCaretAtEnd($cmd)

        index = 0 // set the index for last commands back to zero
    } else if (evt.key === 'ArrowUp') { // go through last commands
        if (Commands.history.length > 0 && index + 1 <= Commands.history.length) {
            $cmd.innerText = Commands.history[index]
            index += 1
            Helper.placeCaretAtEnd($cmd)
        }
    } else if (evt.key === 'ArrowDown') { // return to last commands
        if (Commands.history.length > 0 && index - 1 >= 0) {
            index -= 1
            $cmd.innerText = Commands.history[index]
            Helper.placeCaretAtEnd($cmd)
        }
    } else {
        //automatically transforms the first character to lowercase (mobile devices write the first letter uppercase)
        if ($cmd.innerText.charAt(0) === $cmd.innerText.charAt(0).toUpperCase()) {
            $cmd.innerText = $cmd.innerText.charAt(0).toLowerCase() + $cmd.innerText.substr(1)
            Helper.placeCaretAtEnd($cmd)
            $cmd.focus()
        }
    }
}
$cmd.onkeyup = checkInput

// save last 30 executed commands to local storage
window.onbeforeunload = (evt) => {
    localStorage.setItem('lastCmds', JSON.stringify(Commands.history.slice(0, 30)))
}


/**
 * handles the autocomplete process
 * @param evt KeyboardEvent
 */
document.body.onkeyup = evt => {
    if (evt.key === 'Tab') {
        const tmpInp = $cmd.innerText.replace('\n', '').split(/ +/g)

        if (tmpInp.length === 1) {
            const commandNames = Commands.keys()
            const autoComplete = commandNames.filter(name => name.lastIndexOf(tmpInp[0], 0) === 0)
            if (autoComplete.length === 1) {
                $cmd.innerText = autoComplete[0]
                Helper.placeCaretAtEnd($cmd)
            }
        } else if (tmpInp.length === 2) {
            const previousTree = tmpInp[1].split('/') // turn folder structure to array
            if (previousTree[0] === '.') {
                previousTree.shift()
            }

            const searchWord = previousTree.pop() // save the last not yet typed out word
            const autoComplete = Object.keys(fs.getFolder(fs.activeDirectory.concat(previousTree))) // get all contents of the current directory
                .filter(name => name.lastIndexOf(searchWord, 0) === 0) // search for filenames/directories which start with the searchword
            if (autoComplete.length === 1) { // if only one match was found -> autocomplete
                $cmd.innerText = tmpInp[0] + ' ' + (previousTree[0] ? previousTree.join('/') + '/' : '') + autoComplete[0]
                Helper.placeCaretAtEnd($cmd)
            }
        }

        // focus where the user has left of
        $cmd.focus()
    }
}

$cmd.focus()