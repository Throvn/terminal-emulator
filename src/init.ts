import { CMDs, Path, Filesystem } from './core'

let $cmd = <HTMLDivElement>(
  document.querySelector(".window-content").lastElementChild.lastElementChild
);

export let domCmd = $cmd

/* Command section */
export const Commands = new CMDs({
  help: {
    desc: "a list of all commands",
    func: (path: Path, args: string[]): string => {
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
            </ul> `;
    },
  },
  clear: {
    desc: "clears the screen",
    func: (path: Path, args: string[]): string => {
      $cmd.parentElement.parentElement.innerHTML = "";
      (<HTMLDivElement>(
        document.querySelector(".window-content")
      )).insertAdjacentHTML(
        "beforeend",
        `
                <div class="line">
                    <div></div>
                </div>
            `
      );
      $cmd = <HTMLDivElement>(
        document.querySelector(".window-content").lastElementChild
          .lastElementChild
      );
      return "";
    },
  },
  ls: {
    desc: "lists all the contents of the directory",
    func: (path: Path, args: string[]): string => {
      args[1] = args[1] ? args[1] : ".";

      const pth = args[1].replace(/(\r\n|\n|\r)/gm, "").split("/");
      if (pth[0] === ".") {
        pth.shift();
      }

      let initFS = fs.getFolder(fs.activeDirectory);

      for (let i = 0; i < pth.length; i++) {
        if (pth[i] === ".") {
          pth.shift();
          continue;
        } else if (!pth[i]) {
          continue;
        }

        initFS = initFS[pth[i]];
        if (typeof initFS !== "object") {
          return `<span style="margin-right: 8px;" class="text-error">✘</span> ls: ${args[1]}: no such directory`;
        }
      }

      const contents = Object.keys(initFS);
      let returnString = ``;
      for (let i = 0; i < contents.length; i++) {
        if (contents[i] === "meta") continue;

        const element = initFS[contents[i]];

        if (element && element.meta && element.meta.type === "folder") {
          returnString += `<em class="folder">${contents[i]}</em> \t`;
        } else if (element && element.meta && element.meta.type === "link") {
          returnString += `<a href="${element.link}" class="link">${contents[i]}</a> \t`;
        } else {
          returnString += contents[i] + "\t";
        }
      }

      return returnString;
    },
  },
  cd: {
    desc: "moves into the directory",
    func: (currPath: Path, args: string[]): string => {
      args[1] = args[1] ? args[1] : fs.displayPath;
      if (args[1] === "/") {
        fs.activeDirectory = new Path([]);
        fs.displayPath = "root";
        return;
      }
      if (fs.displayPath === args[1]) {
        return;
      }

      const pth: Path = new Path(args[1].replace(/(\r\n|\n|\r)/gm, ""));

      let initFS = fs.getFolder(fs.activeDirectory);

      for (let i = 0; i < pth.toObject().length; i++) {
        if (pth.find(i) === "..") {
          pth.toObject()[i] = fs.activeDirectory.pop();
          initFS = fs.getFolder(fs.activeDirectory);
          continue;
        } else if (pth.find(i) === ".") {
          pth.shift();
          continue;
        } else if (!pth.find(i)) {
          continue;
        }
        fs.activeDirectory.push(pth.find(i));
        initFS = fs.getFolder(fs.activeDirectory);
        if (!initFS) {
          return `<span style="margin-right: 8px;" class="text-error">✘</span> cd: ${args[1]}: does not exist`;
        } else if (
          typeof initFS !== "object" ||
          initFS.meta.type !== "folder"
        ) {
          fs.activeDirectory.pop(); // remove gibberish element
          return `<span style="margin-right: 8px;" class="text-error">✘</span> cd: ${args[1]}: not a directory`;
        }
      }
      fs.displayPath =
        fs.activeDirectory.toObject().length > 0
          ? fs.activeDirectory.toObject()[
          fs.activeDirectory.toObject().length - 1
          ]
          : "root";
    },
  },
  path: {
    desc: "displays the absolute path",
    func: (path: Path, args: string[]): string => {
      return `${fs.pathPrefix}/${fs.activeDirectory.toString()}`;
    },
  },
  mkdir: {
    desc: "create a directory",
    func: (path: Path, args: string[]): string => {
      if (args.length === 1) {
        return `<span style="margin-right: 8px;" class="text-error">✘</span> mkdir: please specify a name.`;
      }
      fs.getFolder(fs.activeDirectory)[args[1].replace("/", "-")] = {
        meta: {
          type: "folder",
        },
      };
      return `<span style="margin-right: 8px;" class="text-success">✔</span> Success: Directory ${args[1].replace(
        "/",
        "-"
      )} created.`;
    },
  },
  time: {
    desc: "displays the current time",
    func: (path: Path, args: string[]): string => {
      let time = new Date(),
        str: string = "";

      if (time.getHours() <= 5) {
        str += "Good Night";
      } else if (time.getHours() <= 11) {
        str += "Good Morning";
      } else if (time.getHours() <= 15) {
        str += "Good Afternoon";
      } else {
        str += "Good Evening";
      }
      str += `! it is: <span class="timer">${time.toLocaleTimeString()}</span>`;

      setInterval((): void => {
        document.querySelectorAll(".timer").forEach((timer): void => {
          timer.innerHTML = new Date().toLocaleTimeString();
        });
      }, 1000);

      return str;
    },
  },
  cat: {
    desc: "displays the content of the file",
    func: (path: Path, args: string[]): string => {
      args[1] = args[1] ? args[1] : undefined;

      if (!args[1]) {
        return `<span style="margin-right: 8px;" class="text-error">✘</span> Error: please specify a path.`;
      }

      const pth = args[1].replace(/(\r\n|\n|\r)/gm, "").split("/");
      console.log(pth);
      if (pth[0] === ".") {
        pth.shift();
      }
      let file = fs.getFolder(pth);

      if (!file && pth.length === 1) {
        file = fs.getFolder(fs.activeDirectory.concat(pth));
      }

      if (typeof file === "object") {
        console.log(true, file.meta.type);
        if (file.meta.type === "download") {
          // initializes automatic download
          const downloadEL = document.createElement("a");
          downloadEL.setAttribute("download", file["name"]);
          downloadEL.setAttribute("href", file["link"]);
          downloadEL.click();

          return `<span style="margin-right: 8px;" class="text-success">✔</span> Success: The download should have started now. <br> Alternatively click <a href="${file["link"]}" download="${file["name"]}">here.`;
        } else {
          console.log(file);
          return `<span style="margin-right: 8px;" class="text-error">✘</span> Error: /${args[1]} is not a file.`;
        }
      } else if (typeof file !== "string") {
        return `<span style="margin-right: 8px;" class="text-error">✘</span> Error: The file /${args[1]} does not exist.`;
      } else if (typeof file === "string") {
        return file;
      }
    },
  },
  notFound: {
    desc: "prints error message",
    func: (path: Path, args: string[]): string => {
      return `<span style="margin-right: 8px;" class="text-error">✘</span> Error: command not found: ${args[0]}`;
    },
  },
});

Commands.add(
  "hello",
  (path: Path, args: string[]): string => {
    return "Hello yourself ;D";
  },
  "Greets the user"
);

/* Filesystem section */

export const fs = new Filesystem({
  meta: {
    type: "folder",
  },
  "README.md":
    '<h2 class="text-error">## Welcome to my homepage!</h2> I\'m Louis. <br> You will find lots of stuff about me here. <br> Who I am, what I do and what my hobbies are. <br><br> Want to see the <code><a target="_blank" href="https://github.com/Throvn">`source code`</a></code> ? <br> <br> This project is open source and has a modular structure... feel free to contribute, or fork! <br><br>',
  about_me: {
    meta: {
      type: "folder",
    },
    "me.png":
      '<h5><img width="250px" src="https://throvn.github.io/img/me-circle.webp" /></h5>',
    "social_media.rtf": `
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
    "cv.pdf": {
      meta: {
        type: "download",
      },
      link: "../documents/cv.pdf",
      name: "CV - Louis Stanko.pdf",
    },
    "languages.hbs": `<h5>Languages</h5> 
                    <small>German</small>
                    <div class="progressbar-container">
                        <div class="progressbar-inside lang-german"></div>
                    </div> <br> <small>English</small>
                    <div class="progressbar-container">
                        <div class="progressbar-inside lang-english"></div>
                    </div> <br>`,
    certificates: {
      meta: {
        type: "folder",
      },
      "coursera.pem": `
                <h5>All my coursera certificates</h5>
                <ol>
                    <li><a href="https://www.coursera.org/account/accomplishments/certificate/GUJ5EQQUC95A">Mathematics for Machine Learning: Linear Algebra</a></li>
                    <li><a href="https://www.coursera.org/account/accomplishments/verify/967CJAGA27S4">Build a Modern Computer from First Principles: From Nand to Tetris (Project-Centered Course)</a></li>
                </ol>
            `,
      "udemy.pem": `
                <h5>All my udemy certificates</h5>
                <ol>
                    <li><a href="https://www.udemy.com/certificate/UC-544f6a3a-d7e0-41e2-b4a9-b72271febe8a/">AWS Certified Solutions Architect - Associate 2020</a></li>
                    <li><a href="https://www.udemy.com/certificate/UC-5VIXX6IJ/">Automate the Boring Stuff with Python</a></li>
                    <li><a href="https://www.udemy.com/certificate/UC-SIWXZYGZ/">The Complete Node.js Developer Course</a></li>
                    <li><a href="http://ude.my/UC-RANVVGS3">Computer Science 101: Master the Theory Behind Programming</a></li>
                    <li><a href="https://www.udemy.com/certificate/UC-U8N3S427/">The Modern JavaScript Bootcamp</a></li>
                </ol>
            `,
      "edx.pem": `
                <h5>All my edX certificates</h5>
                <ol>
                    <li><a href="https://courses.edx.org/certificates/ee28c26b78884348afb7eaac7b8c073e">Javascript Fundamentals</a></li>
                </ol>
            `,
    },
  },
  projects: {
    meta: {
      type: "folder",
    },
    "skills.txt": `
          <h5>My Skills & Qualifications</h5>
            <pre class='text-center'>
  +-------------------------+       +-----------------------------+
  |     <b>Web Development</b>     |       |       <b>     Other     </b>       |
  +------------+------------+       +--------------+--------------+
  |  Frontend  |  Backend   |       |      App     |     Misc     |
  +------------+------------+       +--------------+--------------+
  | HTML       | Node.js    |       | Swift        | GoLang       |
  | CSS        | MongoDB    |       | React Native | Python       |
  | JavaScript | Express.js |       |              |              |
  | Vue.js     |            |       |              |              |
  +------------+------------+       +--------------+--------------+
            </pre>
        `,
    rushhour: {
      meta: {
        type: "link",
      },
      link: "/demos/rushhour/index.html",
    },
    chatapp: {
      meta: {
        type: "link",
      },
      link: "https://throvn-chat-app.herokuapp.com/",
    },
    pong: {
      meta: {
        type: "link",
      },
      link: "/demos/pong/index.html",
    },
  },
});