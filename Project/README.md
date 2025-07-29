# myPlanner

# Goal
Implement an small little app that (for now only) allows the input of recurring ToDo's that
can be ammended in regularity (including deciding recurrence spacing after each completion as
well as) long-term regularities. If possible, the app should allow on a visual representation of
Today and the next 6 days to plan and re-plan the tasks (per day, optionally adding time).

# How it started
The idea of the usability of this little app came when I continuously forgot when I last
changed my bedsheets, when I maintained my dishwasher or washing machine the last time,
had the last oil change of my car and so on. Life is far too busy, to keep track of those
things in your mind. So why not have a little app helping with reminders and scheduling.

# Files within project folder

## flask_session
Just the flask library that enables having a logged in user who only sees their own data.

## node_modules
the i18next and the jQuery library used in the project for internationalization and making the
website more dynamic.

## static

### images
I aimed to add some pictures. In the end I left them away because of time issues and being able to
add the button icons via 'Bootstrap icons'.

### js
Contains the self-built ajax.js file and the AI guided i18n.js file as well as the planner.js file.
The remaining files are the used libraries files that I loaded in from download instead of dyanmically
loading it online. Just to ensure compatibility with the current versions.

Fot the planner.js file, I pre-filled the start date when entering a new item (7 days ahead).

The i18n.js was the implementation of the multiple languages. As I added it at the very beginning of the
project, it was far too hard to understand for me. But I used the AI at first and made adjsutments with the help of
documentations and AI over time to adjust it to my needs.

Lastly, I would say that the introduction of the ahax.js file is the biggest achievement of the js folder (and even the
project). First I just wanted to understand how it works. Then, after a multitude of hours fighting with the internet and AI,
I started to understand how it works. Also how the structre and logic work on a full-stack level. Hence, I moved towards more and
more modular functions that allow for better design and reusability. Whereas I see it is not perfect, I got to understand it much
more. The desgin decision within this file were also highly influenced by my tasks at work: At work I had to understand a code base
with multiple thousands lines of code in a Django (Rest API framework), React (RTK) setup, using mainly components, hooks and so on.

Also this file grew to be more than 400 lines of codes, quite surprinsing to me. It also led me to loose the overview quite often.

### Addendum: Multilanguage implementation - English, Japanese, German
As I migrated from Europe to Asia and the course challenges us to develop something
that survives the course itself, I see a requirement for my app to be in Japanese as well.
Hence, aiming to use the i18next library to enable both languages on click, with rahter big
challenges for the cache and cookie implementation.

For a quick start, I allowed myself to get a lean navigation bar from Copilot (AI) and lending some
settings (e.g. Validatior function) from the Finance problem set. Especially the validator function,
is very helpful to verify that the translation is propagated properly.

### i18next
To avoid complexity at first, I started to setup the translation setup with a lot of reading on the
library site (https://www.i18next.com/overview/getting-started) and implementing the translation of my
index.html and error.html. Figuring out how to efficiently translating static and variable parts, depending
on the route. From that point point, I continuously build a new function in English and added the Japanese version,
with a default value for English (a.k.a original language).

At first I setup the locales files as the standard locales/{lang}/translation.json and adding the translation codes in the
i18next.js file as well. But the maintenance got crazy pretty quickly and I added namespaces and got rid of the necessary keys in
the i18next.js files accordingly. That made coding progress much faster. Just so you can see from where I came from, I left
the translation.json files in here.

My current setup required to add a key and it's translation to a JSON for each translation and language. Hence, every
change in the JSON structure, especially for nested structures, requires a lot of rework in the HTML. Despite this,
I like the more lean setup, as the text is saved in other files. Further, there is more flexibility for future developments.
Hence, I would like to try a fully automatic DOM traslation setup.

### styles.css
Nothing special here, I was just looking for a simole design, asked AI to make suggestions and simplified it even further. The basic
card setup up for display areas were helping out a lot and made it look really good, without really adding something. I also used it
to modify the bootstrap parts, I dind't like slightly.

## templates
There is not much to say, as in the problem sets, I used the pretty same setup trying to put as much of the details into the
layout.html as possible. The error page was intended to be used far more but whilst implementing the front-end checks, the basically
vanished from the screen. Only if you hack the system, you will be able to see it.

I decided to rebuild the finance problem set login and register pages (including the helpers.py function) with the goal to understand
it with more depth, as I thought that there will be a lot of times, where logins will be required. Hence, good to understand on way
of implement it.

For the index.html, I played around a lot with the requirements of the html validator, the ajax effects and the functions I wanted to
achieve to implement it as cleanly as I currently can. Still don't like front-end too much though...

## app.py
First things first, create sessions:
Right after rendering an empty index.html page, with nothing but a title and some text, I started on the Login and then Register
page. Next, I aimed to implement the session function by using the instruction of the lecture and the 'Finance' problem set as guides
without using pre-developed code from AI. Just to gain a deeper understanding of the implementation of such a page. Thus, setting up
the login page and the create user page in a very simplistic way. The motivation to do this is given by the omnipresence of websites,
apps and others that use the session technique. Only after that I turned to the user benefit...usually not the best way to create
user value in the 'Lean' sense. But as the goal is to make me learn, I guess every new implementation for this project has inherent value.

In addition to the login button, I decided to add a link to the title on the top left, that usually send you to the homepage (index.html). And whilst I am already at it, I aimed to eliminated the button for the active language, as it just bothered me to have the option to click the already selected button. Looking into the logic, I realized once more how uncomfortable I feel with JavaScript. So I decided to first add a third language, so I can properly test the functionality. (In hindsight, I realised, I did not have to do this to test it properly.) Thus, adding German, my mothertongue. For the implementation of the JavaScript, I decided to go through the pain and figure out how to handle the implementation by using AI as a tutor, explicitly only providing guidance and
no code. Time to understad the previously introduced i18Next implementation as well...this took quite some time.

P.S.: It is amazing how easily I could add the third language in this setup though, within like 5~10 minutes.

## Intermezzo: finance.db
Deciding to skip the password for now, I wanted to setup an easy table to reference the correct data to the correct user.
Additionally, I started to note the used SQL command in a seperate file (SQL_commands.txt) for myself as a reference for later on. Just helping me retrace my steps and make testing easier as well. This has proven very valuable during the problem sets.

After creating the desired table, I connected it to SQL Alchemy, apperently what is hidden under the hood of the CS50 library. Whilst
researching how to do this, I found via ChatGPT that to protect from injection attacks, parameter binding should be performed. Hence,
I took the liberty to use the suggested standardization (ChatGPT). Then, I connected the the db and checked for existing usernames (initially done via back-end creation).

## Intermezzo: helpers.py
Here I stored a lot of functions that make my life easier in the app.py and that I used many times. Especially the calls to the DB
via SQL Alchemy. It is quite helpful to have it seperate, just so the code does not overcrowd in tha app.py. Also here, at first to
difficult for my understanding and hence, I used a lot of AI to understand, built and learn over time.

## app.py: Enabling Account creation and registration
As mentioned, the index.html required to finally have a function, even though it is just login/logout at first. So with the database,
I created a login that only requires a random string input and tested it out until the sessions worked like they were set up in the
Finance problem set (mentioned above). Afterwards, I aimed to create account via the website instead of database SQL commands.
Hence, adding the password creation simultaneously. Using it as a problem set recap, I setup back-end checks againts the very easy
hacking steps as seen in the course, skipping front-end checks. Subsequently, adding and requiring the password for login as well.
Further, the password hashing was also enabled in the python file.

## Fullstack: Creation of 'Add Task to DB'
Finally, moving toward the implementation of the actual functions, first adding the command to populate the database with tasks. In
this case, I decided that the tasks and their content would not be translated, as user input cannot be controlled. Assuming they
choose the langauge(s) of their liking. The selection of input fields (including dropdowns), was quite difficult. So I tried to
capture the essence to start with, and at some point I am going to try to add a rich text area instead of only a text area.

## Fullstack:  Creation of the upcoming tasks
Creating some example task shows me that I have successfully created the task list. Then I aimed to display them in the front-end
properly,and that quickly worked as planned. But also showed my some adaptions I had to take care of. First, I used value form the
dropdowns, thatwere aimed for re-use in IDs and so on but not displayable values. Further, using IDs to provide translations through
the i18next internationalization produces duplicate IDs in the html. But using multiple IDs for the identical content also seemed
like bad programming. Hence, solving that challenge was my next step, diving into research right away.

Going witht the assumption that I want to scale the page/app in the long-run, researching possible setup was done with ChatGPT and
additional searches during setup periods (mentioned above in the i18next.js file section). The aim was to extend the automated DOM
translation from the single JSON file per language (locales/{lang}/translation.json) to multiple JSON files, considering the
translation split by functionality (and in second priority by page): 'Common' terminology (e.g. Submit button) with 'Login' &
'Register' (combined due to versatile usage and small vocab) and 'Error' messages (due to the way how the message are dynamically
loaded). For now we will then have all new, upcoming 'Task' translations.

Doing some more research, I found that the initial setup of the i18next, proposed by ChatGPT, was not the recommended approach.
Instead I should have used data elements (data-i18next) for scalability. A great learning on how to use AI and when to rather Google
oneself.

## Future aspirations
- Decouple from CS50 environment (postponed, as I required access from multiple laptops/environments)
- Turn Upcoming tasks to a limit with 5~10 entries
- Create a page for all tasks
- Page with tasks scheduled for the week (visual representation & visual re-scheduling)
- Enable to share certain tasks or lists with other people (flatmate, families; grouped tasks)
