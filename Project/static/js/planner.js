// As my JS skills are still limited, it can be assumed that the function were coed in supported by Google / AI


/**************************************************
    *DOMContentLoaded - Prep for long-term project
 **************************************************/

    document.addEventListener('DOMContentLoaded', () => {
        newTaskDefaultDate();
    })



/**************************************************
    *Upcoming tasks
 **************************************************/


/**************************************************
    *Create new planner entry
 **************************************************/

// DOMContentLoaded // Set default Date to 1 week ahead

    function newTaskDefaultDate() {
        const today = new Date();
        // console.log(today)
        today.setDate(today.getDate() + 7);
        const defaultDate = today.toISOString().split('T')[0];
        // console.log(defaultDate)

        document.getElementById('setStartDate').value = defaultDate;
    }
