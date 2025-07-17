// Classic JavaScript components for Django templates using CDN libraries
// Uses Alpine.js, HTMX, and Axios from CDN

// Configure Axios for Django CSRF protection
if (typeof axios !== "undefined") {
  axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
  axios.defaults.xsrfCookieName = "csrftoken";
  axios.defaults.timeout = 15000;
}

// Utility function to serialize form data
function serialize(data) {
  let obj = {};
  for (let [key, value] of data) {
    if (obj[key] !== undefined) {
      if (!Array.isArray(obj[key])) {
        obj[key] = [obj[key]];
      }
      obj[key].push(value);
    } else {
      obj[key] = value;
    }
  }
  return obj;
}

// Sleep utility
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Date picker constants
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_SHORT_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Initialize Alpine.js components when DOM is ready
document.addEventListener("alpine:init", () => {
  // Counter Component (inline in template)
  Alpine.data("Counter", () => ({
    count: 0,
    handleClick() {
      this.count++;
    },
  }));

  // Date Picker Component
  Alpine.data("DatePicker", () => ({
    dateFormat: "YYYY-MM-DD",
    showDatepicker: false,
    datepickerValue: "",
    selectedDate: "",
    month: null,
    year: null,
    no_of_days: [],
    blankdays: [],
    MONTH_NAMES: MONTH_NAMES,
    MONTH_SHORT_NAMES: MONTH_SHORT_NAMES,
    DAYS: DAYS,

    initDate() {
      let today;
      if (this.selectedDate) {
        today = new Date(Date.parse(this.selectedDate));
      } else {
        today = new Date();
      }
      this.month = today.getMonth();
      this.year = today.getFullYear();
      this.datepickerValue = this.formatDateForDisplay(today);
    },

    formatDateForDisplay(date) {
      let formattedDay = DAYS[date.getDay()];
      let formattedDate = ("0" + date.getDate()).slice(-2);
      let formattedMonth = MONTH_NAMES[date.getMonth()];
      let formattedMonthShortName = MONTH_SHORT_NAMES[date.getMonth()];
      let formattedMonthInNumber = (
        "0" +
        (parseInt(date.getMonth()) + 1)
      ).slice(-2);
      let formattedYear = date.getFullYear();

      if (this.dateFormat === "DD-MM-YYYY") {
        return `${formattedDate}-${formattedMonthInNumber}-${formattedYear}`;
      }
      if (this.dateFormat === "YYYY-MM-DD") {
        return `${formattedYear}-${formattedMonthInNumber}-${formattedDate}`;
      }
      if (this.dateFormat === "D d M, Y") {
        return `${formattedDay} ${formattedDate} ${formattedMonthShortName} ${formattedYear}`;
      }
      return `${formattedDay} ${formattedDate} ${formattedMonth} ${formattedYear}`;
    },

    isSelectedDate(date) {
      const d = new Date(this.year, this.month, date);
      return this.datepickerValue === this.formatDateForDisplay(d);
    },

    isToday(date) {
      const today = new Date();
      const d = new Date(this.year, this.month, date);
      return today.toDateString() === d.toDateString();
    },

    getDateValue(date) {
      let selectedDate = new Date(this.year, this.month, date);
      this.datepickerValue = this.formatDateForDisplay(selectedDate);
      this.isSelectedDate(date);
      this.showDatepicker = false;
    },

    getNoOfDays() {
      let daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
      let dayOfWeek = new Date(this.year, this.month).getDay();
      let blankdaysArray = [];
      for (let i = 1; i <= dayOfWeek; i++) {
        blankdaysArray.push(i);
      }
      let daysArray = [];
      for (let i = 1; i <= daysInMonth; i++) {
        daysArray.push(i);
      }
      this.blankdays = blankdaysArray;
      this.no_of_days = daysArray;
    },

    decreaseDay() {
      if (this.month === 0) {
        this.year--;
        this.month = 12;
      }
      this.month--;
      this.getNoOfDays();
    },

    increaseDay() {
      if (this.month === 11) {
        this.year++;
        this.month = 0;
      } else {
        this.month++;
      }
      this.getNoOfDays();
    },
  }));

  // Task Component
  Alpine.data("Task", () => ({
    deleted: false,
    processing: false,

    async deleteTask() {
      const deleteUrl = this.$refs.button.dataset.deleteUrl;
      this.processing = true;

      try {
        if (typeof axios !== "undefined") {
          await axios.delete(deleteUrl);
        } else {
          const response = await fetch(deleteUrl, {
            method: "DELETE",
            headers: {
              "X-CSRFToken":
                document.querySelector("[name=csrfmiddlewaretoken]")?.value ||
                "",
            },
          });
          if (!response.ok) throw new Error("Delete failed");
        }
        this.deleted = true;
      } catch (error) {
        console.log(error);
      }

      this.processing = false;
    },

    getBtnText() {
      return this.processing ? "Processing" : "Delete";
    },
  }));

  // Modal Form Component (Alpine.js only)
  Alpine.data("ModalForm", () => ({
    open: false,
    processing: false,
    formHtml: "",

    async loadForm() {
      const url = this.$refs.modelForm.dataset.url;
      this.open = true;
      this.formHtml = "Loading...";

      try {
        let response;
        if (typeof axios !== "undefined") {
          response = await axios.get(url);
          this.formHtml = response.data;
        } else {
          response = await fetch(url);
          this.formHtml = await response.text();
        }
      } catch (error) {
        this.formHtml = "Load form error";
      }
    },

    setOpen(state) {
      this.open = state;
    },

    async submitHandler() {
      this.processing = true;

      const modelForm = this.$refs.modelForm;
      const url = modelForm.dataset.url;
      const form = modelForm.querySelector("form");
      let data = new FormData(form);

      try {
        let response;
        if (typeof axios !== "undefined") {
          let formData = serialize(data);
          response = await axios.post(url, formData);
          const respData = response.data;

          if (typeof respData === "object" && respData !== null) {
            const { next, message } = respData;
            this.formHtml = message;
            await sleep(1000);
            window.location.replace(next);
          } else {
            this.formHtml = respData;
          }
        } else {
          response = await fetch(url, {
            method: "POST",
            body: data,
            headers: {
              "X-CSRFToken":
                document.querySelector("[name=csrfmiddlewaretoken]")?.value ||
                "",
            },
          });

          if (
            response.headers.get("content-type")?.includes("application/json")
          ) {
            const respData = await response.json();
            const { next, message } = respData;
            this.formHtml = message;
            await sleep(1000);
            window.location.replace(next);
          } else {
            this.formHtml = await response.text();
          }
        }
      } catch (error) {
        this.formHtml = "Something went wrong";
        console.log(error);
      }

      this.processing = false;
    },

    getBtnText() {
      return this.processing ? "Processing" : "Submit";
    },
  }));

  // Modal Form HTMX Component (Alpine.js + HTMX)
  Alpine.data("ModalFormHTMX", () => ({
    open: false,

    async loadForm() {
      const modalBodyDiv =
        this.$refs.modelForm.querySelector(".htmx-modal-body");
      modalBodyDiv.innerHTML = "Loading...";

      const url = this.$refs.modelForm.dataset.url;
      this.open = true;

      try {
        if (typeof axios !== "undefined") {
          const response = await axios.get(url);
          modalBodyDiv.innerHTML = response.data;
        } else {
          const response = await fetch(url);
          modalBodyDiv.innerHTML = await response.text();
        }

        // Process new content for HTMX behavior
        if (typeof htmx !== "undefined") {
          htmx.process(modalBodyDiv);
        }
      } catch (error) {
        modalBodyDiv.innerHTML = "Load form error";
      }
    },

    setOpen(state) {
      this.open = state;
    },

    async handleModalResponse(event) {
      await sleep(1000);
      if (event.detail && event.detail.next) {
        window.location.href = event.detail.next;
      } else {
        window.location.reload();
      }
    },
  }));
});

// Enable HTMX logging in development
if (typeof htmx !== "undefined" && window.location.hostname === "localhost") {
  htmx.logAll();
}
