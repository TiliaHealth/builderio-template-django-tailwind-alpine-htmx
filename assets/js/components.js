// Simple HTMX + AlpineJS components for task management

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

// AlpineJS Global Store for Modal Form
document.addEventListener("alpine:init", () => {
  Alpine.data("ModalForm", () => ({
    open: false,
    processing: false,
    formHtml: "",

    async loadForm() {
      const url = this.$refs.modelForm.dataset.url;
      this.open = true;
      this.formHtml = "Loading...";

      try {
        const response = await fetch(url);
        const html = await response.text();
        this.formHtml = html;
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
        const response = await fetch(url, {
          method: "POST",
          body: data,
          headers: {
            "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]")
              .value,
          },
        });

        if (
          response.headers.get("content-type")?.includes("application/json")
        ) {
          const respData = await response.json();
          const { next, message } = respData;
          this.formHtml = message;

          // wait 1 second and then redirect to the next page
          await sleep(1000);
          window.location.replace(next);
        } else {
          // set HTML to display form validation error
          const respData = await response.text();
          this.formHtml = respData;
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

  Alpine.data("ModalFormHTMX", () => ({
    open: false,

    loadForm() {
      this.open = true;
      const url = this.$refs.modelForm.dataset.url;
      const target = this.$refs.modelForm.querySelector(".htmx-modal-body");
      htmx.ajax("GET", url, { target: target });
    },

    setOpen(state) {
      this.open = state;
    },

    handleModalResponse(event) {
      if (event.detail.successful) {
        this.setOpen(false);
        // Optionally refresh page or update UI
        window.location.reload();
      }
    },
  }));

  Alpine.data("Task", () => ({
    deleted: false,
    processing: false,

    async deleteTask() {
      const deleteUrl = this.$refs.button.dataset.deleteUrl;
      this.processing = true;

      try {
        const response = await fetch(deleteUrl, {
          method: "DELETE",
          headers: {
            "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]")
              .value,
          },
        });

        if (response.ok) {
          this.deleted = true;
        }
      } catch (error) {
        console.log(error);
      }

      this.processing = false;
    },

    getBtnText() {
      return this.processing ? "Processing" : "Delete";
    },
  }));
});
