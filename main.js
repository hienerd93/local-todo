(function () {
  const weekDayArray = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let ul = null;

  function moveChoiceTo(elem_choice, direction) {
    var span = elem_choice.parentNode,
      td = span.parentNode;
    if (direction === -1 && span.previousElementSibling) {
      td.insertBefore(span, span.previousElementSibling);
    } else if (direction === 1 && span.nextElementSibling) {
      td.insertBefore(span, span.nextElementSibling.nextElementSibling);
    }
  }

  function getTextListFromUl(ul) {
    const lis = ul.getElementsByTagName("li");
    const textList = [...lis].map((item) => item.children[0].innerText);
    return textList;
  }

  function formatDateNow() {
    const now = new Date();
    return `${weekDayArray[now.getDay()]} ${now.getFullYear()}-${
      now.getMonth() + 1
    }-${now.getDate()}`;
  }

  class EditableList extends HTMLElement {
    constructor() {
      // establish prototype chain
      super();

      // attaches shadow tree and returns shadow root reference
      // https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow
      const shadow = this.attachShadow({ mode: "open" });

      // creating a container for the editable-list component
      const editableListContainer = document.createElement("div");

      // get attribute values from getters
      const title = `${this.title} ${formatDateNow()}`;
      const addItemText = this.addItemText;
      const listItems = JSON.parse(localStorage.getItem("todo-store") || "[]");

      // adding a class to our container for the sake of clarity
      editableListContainer.classList.add("editable-list");

      // creating the inner HTML of the editable list element
      editableListContainer.innerHTML = `
        <style>
          li, div > div {
            display: flex;
            align-items: center;
            justify-content: flex-end;
          }

          .icon {
            background-color: #fff;
            border: none;
            cursor: pointer;
            float: right;
            font-size: 1.8rem;
            justify-self: end;
          }

          .add-new-list-item-input {
            width: 240px;
          }

          .todo-text {
            margin-left: 0;
            margin-right: auto; 
          }
        </style>
        <h3>${title}</h3>
        <ul class="item-list">
          ${listItems
            .map(
              (item) => `
            <li>
              <span class="todo-text" contentEditable>${item}</span>
              <button class="up icon">&bigtriangleup;</button>
              <button class="down icon">&bigtriangledown;</button>
              <button class="editable-list-remove-item icon">&ominus;</button>
            </li>
          `
            )
            .join("")}
        </ul>
        <div>
          <label>${addItemText}</label>
          <input class="add-new-list-item-input" type="text"></input>
          <button class="editable-list-add-item icon">&oplus;</button>
        </div>
      `;

      // binding methods
      this.addListItem = this.addListItem.bind(this);
      this.handleRemoveItemListeners =
        this.handleRemoveItemListeners.bind(this);
      this.removeListItem = this.removeListItem.bind(this);
      this.upOrderItem = this.upOrderItem.bind(this);
      this.downOrderItem = this.downOrderItem.bind(this);
      this.upOrderItemListeners = this.upOrderItemListeners.bind(this);
      this.downOrderItemListeners = this.downOrderItemListeners.bind(this);

      // appending the container to the shadow DOM
      shadow.appendChild(editableListContainer);
    }

    // add items to the list
    addListItem(e) {
      const textInput = this.shadowRoot.querySelector(
        ".add-new-list-item-input"
      );

      if (textInput.value) {
        const li = document.createElement("li");
        const span = document.createElement("span");
        const button = document.createElement("button");
        const buttonUp = document.createElement("button");
        const buttonDown = document.createElement("button");
        const childrenLength = this.itemList.children.length;

        span.textContent = textInput.value;
        span.setAttribute("contentEditable", true);
        span.classList.add("todo-text");
        button.classList.add("editable-list-remove-item", "icon");
        button.innerHTML = "&ominus;";
        buttonUp.classList.add("up", "icon");
        buttonUp.innerHTML = "&bigtriangleup;";
        buttonDown.classList.add("down", "icon");
        buttonDown.innerHTML = "&bigtriangledown;";

        this.itemList.appendChild(li);

        this.itemList.children[childrenLength].appendChild(span);
        this.itemList.children[childrenLength].appendChild(buttonUp);
        this.itemList.children[childrenLength].appendChild(buttonDown);
        this.itemList.children[childrenLength].appendChild(button);

        this.handleRemoveItemListeners([button]);
        this.upOrderItemListeners([buttonUp]);
        this.downOrderItemListeners([buttonDown]);

        textInput.value = "";
      }
    }

    upOrderItem(e) {
      moveChoiceTo(e.target, -1);
    }

    downOrderItem(e) {
      moveChoiceTo(e.target, 1);
    }

    // fires after the element has been attached to the DOM
    connectedCallback() {
      const removeElementButtons = [
        ...this.shadowRoot.querySelectorAll(".editable-list-remove-item"),
      ];
      const upElementButtons = [...this.shadowRoot.querySelectorAll(".up")];
      const downElementButtons = [...this.shadowRoot.querySelectorAll(".down")];
      const addElementButton = this.shadowRoot.querySelector(
        ".editable-list-add-item"
      );

      this.itemList = this.shadowRoot.querySelector(".item-list");
      ul = this.itemList;

      this.handleRemoveItemListeners(removeElementButtons);
      this.upOrderItemListeners(upElementButtons);
      this.downOrderItemListeners(downElementButtons);
      addElementButton.addEventListener("click", this.addListItem, false);
    }

    // gathering data from element attributes
    get title() {
      return this.getAttribute("title") || "";
    }

    get items() {
      const items = [];

      [...this.attributes].forEach((attr) => {
        if (attr.name.includes("list-item")) {
          items.push(attr.value);
        }
      });

      return items;
    }

    get addItemText() {
      return this.getAttribute("add-item-text") || "";
    }

    handleRemoveItemListeners(arrayOfElements) {
      arrayOfElements.forEach((element) => {
        element.addEventListener("click", this.removeListItem, false);
      });
    }

    upOrderItemListeners(arrayOfElements) {
      arrayOfElements.forEach((element) => {
        element.addEventListener("click", this.upOrderItem, false);
      });
    }

    downOrderItemListeners(arrayOfElements) {
      arrayOfElements.forEach((element) => {
        element.addEventListener("click", this.downOrderItem, false);
      });
    }

    removeListItem(e) {
      e.target.parentNode.remove();
    }
  }

  window.addEventListener(
    "beforeunload",
    function (e) {
      const todoStore = getTextListFromUl(ul);
      window.localStorage.setItem("todo-store", JSON.stringify(todoStore));
    },
    false
  );
  // let the browser know about the custom element
  customElements.define("editable-list", EditableList);
})();
