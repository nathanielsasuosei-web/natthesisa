import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Computer Basics (BCC) — the beginner course that assumes nothing.
 *
 * Written for somebody who has never used a computer and may be afraid of
 * breaking it: parts and ports, switching on and off safely, the desktop and
 * files, typing and shortcuts, the internet and email, then the practical
 * safety and hygiene that keep a computer working in a Ghanaian office or home
 * — power, dust, backups, passwords and scams.
 */

export const COMPUTER_BASICS_BCC_MODULES: CourseModule[] = [
  module(
    "getting-started",
    "01 · Getting started",
    "The machine, the screen, and the files you cannot see.",
    [
      lesson({
        id: "parts-of-a-computer",
        title: "Parts of a computer and how to start one safely",
        summary:
          "This lesson names every part of a desktop and a laptop, explains what each one does and how to plug it together, and covers the two things beginners worry about most: the correct way to switch a computer on and off (and why holding the power button is a last resort), and what to do when the screen stays black. It assumes you have never touched a computer and ends with you sitting in front of one that is running.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "A computer is not fragile, and you cannot break it by clicking the wrong thing. The two ways people actually damage a machine are physical — spilling liquid, cutting power while it is working — and both are avoidable once somebody explains them. Everything else in this lesson is vocabulary, and vocabulary is what turns a mysterious box into a machine you can operate.",
          },
          {
            heading: "Definition: the parts and what each one does",
            kind: "definition",
            body:
              "**The system unit (or case)** holds the parts you rarely see. Inside it: the **processor (CPU)**, which does the calculating and is described by speed (GHz) and number of cores; **memory (RAM)**, which holds whatever you are working on right now, measured in gigabytes, and which is emptied when the machine is switched off; the **hard disk or SSD**, which stores everything permanently (documents, photographs, programs); and the **motherboard**, which connects all of them.\n\n**The monitor (screen)** shows the output. It is not the computer: switching off a monitor does not stop the computer, and a black screen does not mean the computer is broken.\n\n**The keyboard** sends text and commands. **The mouse** moves a pointer and clicks; a **trackpad** does the same thing on a laptop.\n\n**Speakers and microphone** are input and output for sound. **The webcam** is a camera for video calls.\n\n**Ports** are the sockets on the outside. **USB** sockets (the rectangular ones, and the smaller USB-C) connect flash drives, printers, phones and keyboards; a **HDMI** or VGA socket connects a projector or second screen; an **Ethernet (LAN)** socket takes a network cable; a **3.5 mm jack** takes headphones; and the **power socket** connects the charger. On a laptop, a **battery** lets it work without power, and the **power button** switches it on.\n\n**Peripherals** are everything attached: printer, scanner, external drive, projector, phone. Each one needs either a cable or a wireless connection (Bluetooth, Wi-Fi), and most need to be switched on separately.",
          },
          {
            heading: "Switching on and off correctly",
            kind: "paragraph",
            body:
              "**To start.** Check the power cable is fully in at both ends. If there is a switch on the power strip or the back of the case, turn it on. Press the power button once — usually a circle-with-a-line symbol on the front or top — and wait. The machine will make noise, show a manufacturer's screen, and then a login screen. It can take a minute or two on an older computer; waiting is correct, and pressing the button repeatedly is not.\n\n**To log in.** Type your username and password, then press Enter. On some machines you choose a picture and type only a PIN. Type the password exactly: capitals matter, and the keyboard may be set to a different language. The password box usually hides what you type — it is not broken.\n\n**Where do I type?** In a computer, typing goes to wherever the flashing marker (the **cursor**) is. If you type and nothing appears, click on the box you want to fill in first, then type.\n\n**To switch off.** Use the operating system: click the **Start** button (the Windows logo, bottom left) or the Apple menu (top left), choose **Power**, then **Shut down**. Wait until the screen goes black and the machine stops.\n\n**Why not just hold the power button?** Holding it forces the power off instantly. Anything unsaved is lost and, worse, files can be left half-written so the computer may fail to start next time. It is the equivalent of pulling the plug. Use it only when the machine is completely frozen and nothing else works. **Sleep** and **Hibernate** are the alternatives when you are just stepping away: the machine goes quiet and wakes in seconds with everything still open.\n\n**What not to do.** Do not switch off by pulling the plug or the power strip while the computer is on. Do not place drinks on the desk next to it, or a cup on the case. Do not move a desktop while it is running. Do not block the fan vents; they are what keep it from overheating.",
          },
          {
            heading: "Worked example: the screen is black — a checklist",
            kind: "example",
            body:
              "A computer that appears dead is the most common everyday problem, and the cause is usually one of five things, in this order.\n\n**Is the power reaching it?** Check the plug, the power strip switch and the laptop charger light. On a laptop, a completely flat battery with a broken charger looks exactly like a broken computer.\n\n**Is the monitor on and connected?** Press the monitor's power button; look for a small light. Check that the monitor cable is tight at both the monitor and the case — a slightly loose cable gives a black screen with the computer running happily underneath. If the monitor has an input/source button, press it to select the correct input (HDMI, VGA, DisplayPort).\n\n**Is the machine actually on?** Listen for fan noise and look for a light on the front of the case. No noise, no lights means it is not powered.\n\n**Did the screen sleep?** Press a key or move the mouse or tap the space bar. Most screens go dark after a few minutes of no activity and wake instantly.\n\n**Is it frozen rather than off?** If the pointer will not move and the keyboard does nothing, wait thirty seconds — software sometimes recovers. Then, as the very last resort, hold the power button for about ten seconds and start again.\n\nIf the machine starts but the screen stays black even with a known-good cable and monitor, the fault is inside the machine and it is time to ask for help, with the checklist above completed already — which is exactly what a technician will want to know.",
            code:
              "THE BLACK-SCREEN CHECKLIST (try in this order)\n\n 1. Power strip switch ON?  Charger light ON?  Plug pushed fully in?\n 2. Monitor power button ON?  Any light on the front?\n 3. Monitor cable tight at BOTH ends?  Correct input source selected?\n 4. Any fan noise or light on the case?      (no → the machine is off)\n 5. Press a key / move the mouse              (the screen may be asleep)\n 6. Wait 30 seconds for a frozen program\n 7. LAST RESORT: hold the power button 10 s, then start again\n\nWHAT TO TELL A TECHNICIAN\n  \"Desktop, plugged in, power light on the case, monitor light on, no picture.\n   Cable checked at both ends. Tried another cable/monitor.\"\n  → That message saves an hour of their time and earns you a fast repair.",
            language: "text",
            codeLabel: "Five causes, one last resort",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **\"I will break it.\"** You will not, by clicking, opening or exploring. Only power loss, liquid and physical force cause real damage. Explore freely.\n- **Switching off at the wall while it is running.** This is how files get corrupted. Always shut down through the Start menu.\n- **Holding the power button to switch off every day.** Reserved for a frozen machine. Use Shut down, or Sleep.\n- **Thinking the monitor is the computer.** A black screen is often just the monitor or its cable, and the machine is fine.\n- **Typing without clicking first.** Nothing appears because nothing has focus. Click the box, then type.\n- **Ignoring the fan and the dust.** A dusty fan makes the machine slow and hot, then unreliable. Learn where the vents are and keep them clear.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Part", "What it does", "Measured in", "If it fails"],
              ["CPU (processor)", "Does the calculating", "GHz, cores", "Machine slow or will not start"],
              ["RAM (memory)", "Holds open work temporarily", "GB", "Everything slow, programs crash"],
              ["Disk / SSD", "Stores files permanently", "GB / TB", "Files missing; slow start; errors"],
              ["Monitor", "Displays output", "Inches, resolution", "Black screen (often just the cable)"],
              ["Keyboard / mouse", "Input", "—", "Cannot type or point (check the plug)"],
              ["USB port", "Connects devices", "—", "Device not recognised (try another port)"],
              ["Power / battery", "Supplies electricity", "Watts, Wh", "Will not start without a charger"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "A computer is four parts doing four jobs — a processor that calculates, memory that holds your open work, a disk that remembers, and a screen and keyboard to talk to it — with ports on the outside for everything else. Switch on with one press and patience, shut down through the Start menu, and treat the power button as an emergency exit. Learn the black-screen checklist and you can solve, or accurately describe, the most common fault on the first day.",
          },
        ],
        keyPoints: [
          "Name the main parts of a desktop and a laptop and state what each one does.",
          "Identify USB, HDMI, Ethernet, audio and power ports, and the peripherals they connect.",
          "Start a computer, log in, and shut it down correctly through the operating system.",
          "Explain why force-powering off is a last resort and what can be lost.",
          "Work through the black-screen checklist and describe the fault to a technician.",
        ],
        exercises: [
          "Identify and name every port on the computer you are using, and say what you would connect to each.",
          "Start the computer from completely off, log in, and then shut it down properly. Write the steps in your own words.",
          "Use Sleep or Hibernate instead of shutting down, then wake the machine and describe the difference.",
          "Deliberately unplug the monitor cable (power off first), then reconnect it and start the machine. Note what the screen showed.",
          "Write the black-screen checklist from memory and test it on a machine with the monitor switched off.",
        ],
        challenge:
          "Set up one workstation from scratch: connect the monitor, keyboard, mouse, power and network, switch it on, log in, and confirm that everything works. Then write a one-page instruction sheet for the next person who uses that desk — how to switch it on, how to log in, how to shut it down, and what to check first if there is no picture — and test the sheet by asking somebody to follow it without your help.",
      }),

      lesson({
        id: "desktop-files-and-mouse",
        title: "The desktop, files, folders and the mouse",
        summary:
          "Files and folders are the back of a computer that beginners never see, and where most early frustration lives: a document saved to a place nobody can find again, a photograph copied instead of moved, a USB drive unplugged mid-copy. This lesson covers the desktop, the taskbar, windows, the mouse and keyboard basics, and a clear method for saving, finding and organising files — including the naming and folder habits that save an office hours every week.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Somebody who cannot find their own file will not trust the computer, and the reflex becomes saving everything to the desktop — which produces a screen of sixty icons and one more person convinced that computers are difficult. Files are not difficult, but they are invisible, and anything invisible needs a system and a few habits.",
          },
          {
            heading: "Definition: desktop, window, file, folder, path, drive",
            kind: "definition",
            body:
              "**The desktop** is the area behind everything, like the physical desk. **Icons** are the items on it. **The taskbar** (bottom of the Windows screen; the dock on a Mac, usually at the bottom or side) shows open programs, so you can switch between them, and the Start button opens the list of everything installed. **The clock** sits in the bottom-right corner (the *system tray* on Windows), next to small icons for sound, network and battery.\n\n**A window** is a program's rectangle on the screen. Its top-right corner has three buttons: **minimise** (a dash, hides the window without closing it), **maximise/restore** (a square, makes the window fill the screen), and **close** (an X, ends the program and may ask you to save).\n\n**A file** is a single item: a document, a photograph, a video, a spreadsheet, a song. Every file has a **name** and often an **extension** after a dot that tells the computer its type: `.docx` (Word document), `.xlsx` (Excel), `.pdf` (portable document), `.jpg` or `.png` (image), `.mp4` (video), `.txt` (plain text). Knowing extensions is how you avoid the classic mistake of trying to open a PDF in Word and getting nonsense.\n\n**A folder** (also called a directory) is a container for files and other folders. Folders inside folders create a **tree**, and it is how everything on the computer is organised.\n\n**A path** is the address of a file: `This PC → Documents → 2026 → Invoices → March → Invoice-0142.pdf`.\n\n**Drives** are named locations. `C:` is usually the internal disk (Windows calls it *Local Disk* or *Windows (C:)*), and many offices have `D:` as a second partition or a separate data disk. **USB drives** (flash disks) appear as a new drive letter when plugged in, and **network drives** are folders on a server that appear as `Z:` or similar. **OneDrive** and **Google Drive** are folders that also copy themselves to the internet — convenient and dangerous in equal measure if you do not understand that deleting the synced folder deletes it online too.",
          },
          {
            heading: "The mouse and keyboard, precisely",
            kind: "paragraph",
            body:
              "**The mouse** moves the pointer. **Left click** selects an item or presses a button. **Double click** opens a file or folder (a single click in the browser; double in Windows Explorer). **Right click** opens a menu of actions for whatever is under the pointer — this menu is where rename, copy, delete, properties and \"Open with\" live, and it is the single most useful thing a beginner can learn. **Drag** (press and hold the left button, move, release) moves an item, including into a folder. **Scroll wheel** moves up and down a page.\n\nA **trackpad** on a laptop does the same: one finger to move, tap or press to click, two fingers to scroll, and often a two-finger tap for the right-click menu.\n\n**Keyboard essentials:** the **letters/numbers**, **Shift** (capital letters and the upper symbol on a key), **Caps Lock** (all capitals — press it again to turn it off; a light usually shows it is on), **Enter** (confirm, or start a new line), **Backspace** (delete the character to the left), **Delete** (remove the selected item or the character to the right), **Tab** (jump to the next box or indentation), the **arrow keys**, and the **spacebar**.\n\n**Shortcuts that are worth learning on day one:** `Ctrl + C` copy, `Ctrl + X` cut, `Ctrl + V` paste, `Ctrl + Z` undo (your best friend), `Ctrl + Y` redo, `Ctrl + A` select all, `Ctrl + S` save, `Ctrl + F` find, `Ctrl + P` print, `Alt + Tab` switch between open windows. On a Mac, use `Cmd` in place of `Ctrl`.\n\n**Copy or move?** Copy leaves the original and creates a second one (`Ctrl + C` then `Ctrl + V`); move takes it away (`Ctrl + X` then `Ctrl + V`). Beginners who copy a file to a USB drive, then edit the copy, are surprised when the original is unchanged — and beginners who forget to **eject** a USB drive (safely remove, in the system tray) risk a half-written file.",
          },
          {
            heading: "Worked example: a folder system that works",
            kind: "example",
            body:
              "An office of five people shares one computer for invoices and one for records. Files were saved wherever the person happened to be: some on the desktop, some in `Downloads`, some inside the folder of an unrelated job. Finding last quarter's invoices took twenty minutes; often it took longer, and sometimes it ended in a phone call.\n\nThe fix is a folder tree, one naming rule, and five minutes at the end of each day. Note the two principles: the top level is by **year**, because the office reports annually and old years can be archived; inside a year, folders are by **area of work**, not by person, because people change roles and the work does not.\n\nThe naming rule is the part that the whole office adopted in a week: `Area-YYYY-MM-DD-description`, no spaces that break in some systems, and the date written as year-month-day so that sorting alphabetically also sorts chronologically. Two conventions make all the difference — a date that sorts, and a comment at the end of names to distinguish versions (`-final`, `-signed`).\n\nThe measured result: finding any invoice now takes under a minute, because the path is guessable by anybody; and nothing depends on knowing where the last person put it.",
            code:
              "Documents/\n  2026/\n    Invoices/     Area-2026-03-14-WestAfrica-supplies.pdf\n                  Area-2026-03-18-NorthGate-signed.pdf\n    Reports/      Q1-report-2026-04-02-final.docx\n    Clients/\n      Acme/       Acme-contract-2026-02-01-signed.pdf\n    Records/      student-register-2026-T1.xlsx\n    Correspondence/\n  2025/            ← finished years stay, but you rarely open them\n  _Archive/        ← anything older, moved once a year\n  _Templates/      ← invoice and letter templates, never edited in place\n\nNAMING RULE\n  Area-YYYY-MM-DD-brief-description[-version].ext\n  · year first, so sorting by name is sorting by date\n  · no spaces; hyphens instead\n  · no \"final-final\"; use -v2, -signed, -approved\n  · dates written 2026-03-14, never 14/03/26 or March 14\n\nDAILY FIVE MINUTES\n  □ everything new is inside 2026/, not on the desktop\n  □ the desktop has only shortcuts, never the only copy of a file\n  □ USB drives are ejected before removing them\n  □ the day's work is saved (Ctrl+S) and, if it matters, copied to the shared drive",
            language: "text",
            codeLabel: "Two levels, one naming rule, five minutes a day",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Saving everything to the desktop.** A screen of icons is not a filing system, and none of those files are findable by search. Use Documents and folders.\n- **Copying when you meant to move (or the reverse).** Two versions then diverge with no way to tell which is current — which is exactly why naming and version history matter.\n- **Removing a USB drive while it is copying.** It corrupts the file being written. Eject it, then pull it out.\n- **Renaming a file's extension by accident.** Changing `report.docx` to `report.pdf` does not convert the file; it makes it unopenable. Rename only the part before the dot.\n- **Deleting with `Shift + Delete`.** That skips the Recycle Bin. Plain Delete, then empty the bin only when you are sure.\n- **Treating OneDrive or Google Drive as a normal folder.** It synchronises: a delete or a rename propagates to every device and to the cloud. That is helpful for version history and dangerous when you are sorting things out in a hurry.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Action", "How", "Result", "Watch out for"],
              ["Open a file or folder", "Double click", "It opens", "Single click only selects"],
              ["See what can be done with an item", "Right click", "A menu of actions", "The fastest way to learn Windows"],
              ["Move a file", "`Ctrl + X`, then `Ctrl + V`", "Original is gone from the old place", "You cannot find it if you forget the cut"],
              ["Copy a file", "`Ctrl + C`, then `Ctrl + V`", "A second, independent copy", "Editing one does not edit the other"],
              ["Rename (keep the type)", "`F2`, edit the name before the dot", "New name, same file type", "Do not change the extension"],
              ["Undo a mistake", "`Ctrl + Z`", "Whatever just happened, reversed", "Only within the current program"],
              ["Find a file by name", "Type in the Start menu / `Ctrl + F` in the folder", "A list of matches", "Search matches names, not always content"],
              ["Remove a USB drive", "Eject in the system tray, then pull", "Safe removal", "Never while a copy is running"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Files and folders are the invisible part of the computer: a tree of drives, folders, files and extensions reached by clicking, right-clicking, dragging and a handful of shortcuts. Save deliberately into a folder, name files with the date first so they sort, copy rather than move when you want two versions, eject USB drives properly, and use `Ctrl + Z` without fear — the computer will forgive almost anything you do in here.",
          },
        ],
        keyPoints: [
          "Identify the desktop, taskbar, window controls, icons and the system tray.",
          "Explain file names, extensions, folders, drives and the path to a file.",
          "Use left click, right click, double click, drag and the essential keyboard shortcuts.",
          "Distinguish copy from move and remove a USB drive safely.",
          "Organise files into a folder tree with a predictable naming rule.",
        ],
        exercises: [
          "Create a folder called `Computer Practice` in Documents, then inside it create two folders and save one file into each.",
          "Rename a file using `F2` without changing its extension, then confirm it still opens.",
          "Copy a file to a second folder, edit the copy, and describe what happened to the original.",
          "Practice five shortcuts (`Ctrl+C`, `Ctrl+V`, `Ctrl+X`, `Ctrl+Z`, `Alt+Tab`) and write down when each is useful.",
          "Build the year/area folder structure for your own work, then name ten files using the `Area-YYYY-MM-DD-description` rule.",
        ],
        challenge:
          "Organise one real computer: create the folder structure for the current year, move every loose document from the desktop and the Downloads folder into it with correct names, delete or archive what is no longer needed, set up a shortcut-based desktop instead of a file dump, and empty the Recycle Bin after checking. Then write the naming rule on a card that the next person at that machine can follow.",
      }),
    ]
  ),

  module(
    "connecting-and-keeping-it-working",
    "02 · Connecting and keeping it working",
    "Internet, email, safety, and the habits that keep a machine useful.",
    [
      lesson({
        id: "internet-and-email-basics",
        title: "The internet, browsing and email",
        summary:
          "The internet begins with a connection and a browser, and both have vocabulary worth knowing: Wi-Fi versus mobile data, what \"the page cannot be reached\" actually means, searches, tabs and downloads, forms and passwords. This lesson covers the internet in plain language, safe browsing and searching, email — sending, replying, attachments and the folders that keep an inbox usable — and the security habits that prevent the most common problems: weak passwords, phishing messages and files from strangers.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "For most people the computer is mostly the internet: WhatsApp Web, email, a bank or Mobile Money page, a government portal, a school portal, YouTube. That makes the browser the most-used program on the machine, and it makes two skills essential — knowing what the messages and buttons actually mean, and recognising the messages designed to trick you.",
          },
          {
            heading: "Definition: connection, browser, search, download, email",
            kind: "definition",
            body:
              "**An internet connection** reaches your computer by one of three routes: **Wi-Fi** (a wireless network, usually with a password — the name of the network is the SSID), **Ethernet** (a cable from the computer to the router, the fastest and most reliable), or **mobile data** (a SIM card with a bundle, used by phones, tablets and some laptops). **A router** shares one connection among many devices and is also what makes a home network.\n\n**A browser** is the program you browse with: Chrome, Edge, Firefox, Safari, Opera. **A tab** is one page inside the browser window; **an address bar** is where you type the address (`www.example.com`) or a search phrase. **A bookmark** (or favourite) saves a page for later. **History** records where you have been. **Incognito/private mode** does not save history on that device but does not hide anything from your network or from the websites — a common misunderstanding.\n\n**A search engine** (Google, Bing, DuckDuckGo) finds pages. Searches are more useful with specific words in quotes ('\"school fees Accra\"'), and less useful as full sentences. The top results marked \"Ad\" are advertisements, not necessarily the best answer.\n\n**A download** is a file brought to your computer, usually landing in the `Downloads` folder. Uploading is sending a file (for example, attaching it to an application form). The browser will usually ask where to save it, or put it in `Downloads` without asking.\n\n**A form** collects information and sends it. Filling one in safely has three rules: check the address bar really shows the organisation's own website; check the padlock (https) before typing personal details; and never enter a bank PIN, a full card number or a One-Time Password anywhere except the bank's own app or website.\n\n**Email** is a message with an address of the form `name@domain.com`. Fields: `To` (the person who must act), `Cc` (people who should know), `Bcc` (hidden recipients). It has a **Subject** (describe the content), a **body**, **attachments** (files up to the provider's size limit, often 25 MB — larger files need a link instead), and folders (**Inbox**, **Sent**, **Drafts**, **Spam**, **Trash**). **Reply** answers the sender; **Reply all** answers everybody on the message, and is the cause of most email embarrassment — check before using it. **Forward** passes the message on, and you should delete the previous recipients' addresses from the body when forwarding publicly.\n\n**A signature** at the bottom with your name, role, organisation and phone number is standard in a professional setting. **Attach the file before writing the message**, not after, so you never send the sentence that promises an attachment you forgot to add.",
          },
          {
            heading: "What the messages mean, and what to do",
            kind: "paragraph",
            body:
              "**\"You are not connected to the internet\" / \"No internet, secured\".** The computer has joined the network but the network has no working connection. Check the router lights, try another site, and use mobile data if you need to keep working.\n\n**\"This site can't be reached\" (or `ERR_NAME_NOT_RESOLVED`).** The address could not be found. Often the internet is down; sometimes the address is mistyped. Try a search for the organisation's name instead of guessing the address — and be extremely careful clicking search results for banks and government services, because the first result may be an advertisement for an impostor. Type the address you know, or use a bookmark saved the first time you were sure.\n\n**\"401 Unauthorised\" / \"403 Forbidden\".** You are not signed in, or this account is not allowed. Not usually a fault to fix; sign in with the right account.\n\n**\"404 Not Found\".** The page has moved or no longer exists. Go to the site's home page and navigate from there.\n\n**\"The connection is not private\" / certificate warning.** The site is not proven to be who it claims. **Do not continue**, especially on a banking, government or payment page. Close the tab and reach the organisation the way you normally do.\n\n**\"Your connection is slow.\"** Pages full of video and advertising load slowly on a weak connection. Turn off automatic video playback, close unused tabs, and avoid running downloads while doing something urgent.\n\n**Phishing: the messages that are designed to fool you.** A request for a password, a PIN or an OTP; a message saying your account will be closed today; a link where the address is subtly wrong (`gtbank-gh.com` instead of the real domain); an attachment you did not expect; a bank, a delivery company or a school asking you to \"confirm your details\"; a WhatsApp message from a \"relative\" with a new number and an urgent need. The safe response is always the same: **stop, do not click, contact the organisation or person through a number you already have, and confirm before doing anything.** No legitimate organisation asks for a PIN or a one-time password. None.",
          },
          {
            heading: "Worked example: a first week of real tasks",
            kind: "example",
            body:
              "This is the sequence an office beginner is usually asked to do in week one — searching, filling a form, downloading and printing, then emailing — and where each step goes wrong.\n\n**Find the organisation's real website.** Search the name, then check the address carefully before clicking: the real one is usually the shortest, and advertisements sit at the top. Save it as a bookmark immediately, and from then on use the bookmark rather than searching again. This single habit is the strongest protection against fake banking and government sites.\n\n**Fill in a form.** Everything marked with an asterisk is mandatory. Phone numbers should be typed without spaces or with them consistently; email addresses are checked for an `@` and a dot. If the form says the session expired, the information may be lost — type long answers into a note first, then paste them in. Never type a bank PIN into a web form.\n\n**Download a file.** It lands in `Downloads`. Move it to a proper folder straight away, because the next person will not look there; and check the extension before opening — a file named `invoice.pdf.exe` is a program, not a document, and it is a very common attack.\n\n**Print a PDF.** Open it, press `Ctrl + P`, choose the printer, set the pages and copies, then Print. If nothing comes out, check the printer's paper, its power, and the print queue (the little printer icon in the system tray) — the job may be stuck behind an older one.\n\n**Send it by email.** Start a new message, put the recipient in `To`, write a subject that says what it is (`March invoices for West Africa Supplies`), write two sentences of body, attach the file *before* writing (or check it is attached before sending), and read the whole message once before clicking Send. When replying to a group, decide deliberately between Reply and Reply all.",
            code:
              "WEEK-ONE TASKS AND THE FAILURE TO AVOID\n\n 1  find the real website        → save a BOOKMARK; never trust the top search\n                                  result for a bank or a government page\n 2  fill in an online form       → check the address bar + padlock; never type a\n                                  PIN or OTP; type long answers in a note first\n 3  download a file              → it lands in Downloads: MOVE it to a folder\n                                  check the extension (.exe = a program)\n 4  print a document             → Ctrl+P · choose the printer · pages/copies\n                                  stuck? check paper, power, and the print queue\n 5  email it                     → subject names the content; attach the file\n                                  before writing; read once before Send;\n                                  Reply or Reply all — decide deliberately\n\nEVERYDAY SAFETY RULES\n  • a strong, unique password for email (the key to everything else)\n  • nobody legitimate asks for your PIN or one-time password — ever\n  • sign out of shared computers; never save passwords on one\n  • public Wi-Fi: no banking, no Mobile Money, no PINs\n  • back up what matters weekly; a computer will fail eventually",
            language: "text",
            codeLabel: "The first office week, and where it goes wrong",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **\"Incognito mode hides me.\"** It stops the browser saving history on that device. Your network, your employer and the websites still see everything.\n- **Clicking the first search result for a bank.** Advertisements and look-alike domains are the main route to stolen credentials. Use bookmarks.\n- **Replying to all by habit.** Check the recipients every time; a private remark sent to a distribution list cannot be recalled.\n- **Using one password everywhere.** When one site leaks, attackers try the same pair on email and banking. Email needs its own strong password, and it needs two-step verification.\n- **Opening unexpected attachments.** Especially compressed files (`.zip`), spreadsheets with macros, and double extensions. When in doubt, ask the sender by a channel you already trust.\n- **Typing card details on a page you reached by clicking a link in an SMS.** Type the address, or use the organisation's app.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Message or situation", "What it means", "What to do"],
              ["No internet, secured", "Wi-Fi joined but no working connection", "Check router lights; try mobile data"],
              ["This site can't be reached", "The address was not found", "Check the internet; use a bookmark, not a guess"],
              ["404 Not Found", "The page does not exist or moved", "Go to the site's home page"],
              ["Connection is not private", "Site identity unproven — possible attack", "Close it; reach the organisation another way"],
              ["Session expired on a form", "Too long inactive; entries may be lost", "Re-enter carefully; paste from a note for long text"],
              ["File in Downloads will not open", "Wrong program, or a dangerous extension", "Check the extension; use \"Open with\"; do not run unknown `.exe`"],
              ["\"Confirm your account\" email or SMS", "Almost always phishing", "Do not click; contact the organisation on a known number"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "The internet is a connection plus a browser, and most of the skill is knowing what the errors mean and what a page is really asking for. Use bookmarks for anything that involves money or identity, never enter a PIN or OTP into a web form, move downloads out of the Downloads folder, and write emails with a readable subject, the file attached before the sentence that promises it, and a deliberate choice between Reply and Reply all. Those few habits prevent nearly every beginner-level disaster.",
          },
        ],
        keyPoints: [
          "Describe Wi-Fi, Ethernet and mobile data, and a router's role in sharing a connection.",
          "Use a browser competently: address bar, tabs, bookmarks, history, downloads.",
          "Interpret the common browser and connection messages and what each requires.",
          "Send email correctly: subject, To/Cc/Bcc, attachments, Reply versus Reply all.",
          "Recognise phishing and follow the safe response: stop, verify, never give a PIN or OTP.",
        ],
        exercises: [
          "Connect to a Wi-Fi network, open a browser, and bookmark the website of your school or employer.",
          "Search for three pieces of information you need, and note which results were advertisements.",
          "Download a PDF, move it out of Downloads into a proper folder, then open and print it.",
          "Send yourself an email with a subject, two sentences and one attachment. Then reply to it and note where it appears in your inbox.",
          "Find one scam message (a real one from your phone, or an example from a news article) and write down the three clues that it is fake.",
        ],
        challenge:
          "Complete a realistic administrative task end to end: find the correct official website for a service you need, save it as a bookmark, read the guidance, fill in an online form, download and file the confirmation, print it, and email it to the right person with a clear subject and a professional signature. Then write the three things you would check before doing it again for a different service, and one message you would ignore as a scam.",
      }),

      lesson({
        id: "safety-maintenance-and-good-habits",
        title: "Safety, maintenance and good habits",
        summary:
          "A computer is a machine that needs power, cleaning, backups and passwords — and its owner needs habits. This lesson covers protecting the machine physically (power, surges, heat, dust, liquids, transport), the software basics (updates, antivirus, what to install and what never to install), backup that actually works, password practice and account safety, and the professional habits of an office: shared computers, printing sensibly, printing costs, data privacy and knowing when to back away and ask for help.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "In Ghana the two things that kill computers most often are unreliable power and dust, and the two things that lose the most work are no backup and a forgotten password. All four are preventable with cheap equipment and a few habits — which is exactly why they belong at the end of a beginner course rather than in an appendix.",
          },
          {
            heading: "Definition: surge, UPS, backup, malware, account safety",
            kind: "definition",
            body:
              "**Power problems.** A **surge** is a sudden spike in voltage — from a grid switch, lightning, or a generator changeover. A **surge protector** (a power strip with surge protection, not a cheap extension lead) absorbs spikes and costs a fraction of a computer. A **UPS (uninterruptible power supply)** contains a battery and gives you minutes of power: enough to save your work and shut down properly, and it also smooths the small dips that cause sudden restarts. If you work with a desktop and there is any chance of an outage, a UPS is the single best purchase you can make.\n\n**Heat and dust.** Dust blocks the vents and the fan, and a hot machine slows itself down, then becomes unreliable. Keep the computer off the floor where dust settles, keep the vents clear, do not use it on a bed or cushion, and have it cleaned properly (compressed air and a service) about once a year in a dusty environment.\n\n**Liquids and movement.** Drinks go on a different surface from the computer, never above the keyboard. Laptops travel in a padded bag, screen protected and nothing pressing on the lid; a charging laptop on a soft surface with blocked vents is a fire risk.\n\n**Software updates.** Operating system and browser updates contain security fixes. Install them, restart when asked, and do not postpone for weeks. Most successful attacks exploit something that was patched long ago.\n\n**Antivirus and what to install.** Use the protection built into Windows (Windows Security) or a reputable paid product, and keep it updated. Beyond that, the practical rule: install programs only from the vendor's own website or the operating system's store, never from a link in an email, a WhatsApp group or an advert on a download site; and never install \"cracks\", \"activators\" or \"free\" versions of paid software, which are the most reliable way to get malware on an office machine.\n\n**Backup that works.** Decide what cannot be lost (invoices, records, photographs, assignments) and keep three copies: the working copy, a copy on a separate device (an external drive or a USB drive, kept separately), and a copy elsewhere (OneDrive, Google Drive, or a drive kept at another location). Do it on a schedule — weekly is enough for most offices — and **test** that the copy opens: an untested backup is a hopeful folder.\n\n**Password practice.** Length beats complexity: a passphrase of four unrelated words is stronger than eight characters of symbols and much easier to remember. Use a different password for email, banking and each important service — because a leaked password from one site is tried on all the others. Never share a password in a WhatsApp message; if a colleague needs access, use a shared account designed for it rather than your own. Turn on **two-step verification** for email above all, since email can reset every other account you own.\n\n**Account and data safety in an office.** Use your own account on a shared computer (never somebody else's), sign out when you finish, never tick \"remember me\" on a shared machine, lock the screen (`Windows + L`) whenever you leave your desk, keep personal files off a work machine, and treat customer information — names, phone numbers, ID numbers, marks, medical details — as confidential by default. In Ghana, the Data Protection Act (Act 843) makes the handling of personal data a legal responsibility, not just good manners.",
          },
          {
            heading: "Worked example: a week's habits that prevent a month of trouble",
            kind: "example",
            body:
              "A small office of four shares two desktops and a printer, with power that goes off at least twice a week. Before, the habits were: shut down at the wall when the power dipped, save files to the desktop, one password shared by everybody, and a backup \"when somebody remembers\". The results were predictable — corrupted invoices, a lost term of records, and a near-miss when a phishing message offering \"a new bank verification portal\" reached two staff.\n\nAfter, the routine is small enough to be kept. Two surge protectors and one UPS on the machine that handles money and records. A weekly backup on Friday afternoon: copy the records folder to an external drive, then to the shared cloud folder, and open one file from each copy to prove it works — five minutes. One strong passphrase per person for their own account, two-step verification on the office email, and no password ever typed into a WhatsApp message. Screen locked whenever a person leaves their desk, and a printed card near the printer with the three rules for opening attachments.\n\nThe measurable outcome over the following six months: no lost files, no corrupted documents after power cuts, and one suspicious email — recognised and reported rather than clicked. The total cost of the equipment was less than one week's lost work had cost them before.",
            code:
              "DAILY\n  □ save (Ctrl+S) as you work — never rely on remembering\n  □ Windows + L whenever you leave your desk\n  □ sign out of shared machines; never tick \"remember me\"\n  □ drinks on a separate surface; vents clear\n\nWEEKLY (five minutes)\n  □ copy the records folder to the external drive\n  □ copy it to the shared cloud folder\n  □ OPEN one file from each copy to prove the backup works\n\nMONTHLY\n  □ install the updates waiting in the system tray, then restart\n  □ run a full antivirus scan\n  □ check that two-step verification is on for email\n  □ clear the Downloads folder into its proper folders\n\nWHEN SOMETHING HAPPENS\n  Power cut          → UPS keeps the screen on: save, then shut down properly\n  Suspicious email   → do not click; ask the sender on a known number\n  Machine is hot     → shut down, clear the vents, do not block the fan\n  Liquid spilled     → switch off at the wall, unplug, do not switch it on wet\n  You are stuck      → stop, write down what you see, ask — guessing makes it worse",
            language: "text",
            codeLabel: "Small habits, in the order they matter",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **A cheap extension lead as surge protection.** Protection must be built in and still working; the cheapest \"protectors\" are extension leads with a sticker.\n- **Doing important work with no UPS.** One outage at the wrong moment can corrupt an open file — and it always happens during the one document you spent the afternoon on.\n- **Backing up to the same computer.** A second folder on the same disk does not survive the disk failing, theft or ransomware. The copy must be on a different device.\n- **Never testing a backup.** Restores are the only thing that proves a backup exists. Open a file from the copy.\n- **One password shared across the office.** Nobody can be held accountable, nobody can be revoked, and one leak compromises everything.\n- **Putting off updates and restarts.** Security fixes work only after they are installed.\n- **Clicking \"allow macros\" on a document you were not expecting.** It is one of the oldest and most effective attacks against offices.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Risk", "Likely consequence", "Prevention", "Cost"],
              ["Power surge or outage", "Damaged parts, corrupted files", "Surge protector, UPS, save often", "Low to moderate"],
              ["Dust and heat", "Slow, unstable, shortened life", "Clear vents, clean annually", "Near zero"],
              ["Liquid spill", "Dead keyboard or motherboard", "Drinks elsewhere; power off and unplug immediately", "Zero"],
              ["No backup", "Permanent loss of records", "Three copies, one off-site, tested", "Low"],
              ["Weak or reused password", "Email and accounts taken over", "Passphrases, unique per service, two-step verification", "Zero"],
              ["Phishing and malicious attachments", "Stolen credentials, malware", "Verify before clicking; never enter a PIN or OTP", "Zero"],
              ["Unpatched software", "Exploited by known attacks", "Install updates and restart", "Zero"],
              ["Unauthorised software", "Malware, licence problems", "Install only from the vendor", "Zero"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Keeping a computer working is mostly cheap prevention: a surge protector and preferably a UPS, clean vents, no drinks nearby, updates installed, software only from trustworthy sources, a tested backup on a separate device, and passwords that are long, unique and never shared. Add the office habits — lock the screen, use your own account, treat other people's data as confidential, and stop and ask when something looks wrong — and the machine will last longer while losing less of your work.",
          },
        ],
        keyPoints: [
          "Explain what a surge protector and a UPS each protect against, and why both are cheap insurance.",
          "Protect a machine physically: heat, dust, liquids, transport and blocked vents.",
          "Keep software updated and install programs only from trustworthy sources.",
          "Maintain a tested three-copy backup, one copy off-site.",
          "Apply password, account and data-privacy habits in a shared office environment.",
        ],
        exercises: [
          "Inspect the computer you use: check the vents, the power connection, and whether the power strip is genuinely surge-protected. Write down what you would change.",
          "Perform a backup of one folder to a USB drive and to a cloud folder, then open a file from each copy to prove it works.",
          "Check for pending operating system updates, install them, and restart the machine.",
          "Write your own passphrase of four unrelated words, then set two-step verification on your email account.",
          "Draft a one-page data-handling note for an office: what counts as personal data, who may see it, where it is stored and how long it is kept.",
        ],
        challenge:
          "Set up one real computer for safe everyday use: surge protection in place, updates installed, antivirus confirmed active, a weekly backup routine on a separate device that you have tested by restoring a file, screens locked as a habit, a strong unique email password with two-step verification, and a printed checklist beside the machine. Then write one page of rules for the people who share it, and review it after a month to see which rules were actually followed.",
      }),
    ]
  ),
];
