import Product from "../models/product.js";

export default {
  activeOrBlocked: function (status) {
    if (!status) {
      return {
        text: "Active",
        class: "alert-success",
      };
    } else {
      return {
        text: "Blocked",
        class: "alert-danger",
      };
    }
  },
  checkActive: function (status) {
    if (!status) {
      return true;
    } else {
      return false;
    }
  },
  isThirdUser: (index) => index === 2,
  json: function (data) {
    return JSON.stringify(data) || null;
  },
  getFirstImageUrl: function (name) {
    return `assests/${name[0]}`;
  },
  getFirstImageUrl1: function (name) {
    return `assests/${name[1]}`;
  },
  getFirstImageUrl2: function (name) {
    return `assests/${name[2]}`;
  },
  check: function (v1, v2, option) {
    if (v1 === v2) {
      return option.fn(this);
    }
    return option.inverse(this);
  },
  range: function (start, end) {
    var result = [];
    for (var i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  },
  add: function (a) {
    return a + 1;
  },
  substract: function (a, b) {
    return a - b;
  },
  eq: function (a, b) {
    return a === b;
  },
  gt: function (a, b) {
    return a > b;
  },
  lt: function (a, b) {
    return a < b;
  },

  isActive: function (tab, currentTab) {
    return tab == currentTab;
  },
  loop: function (n, options) {
    let result = "";
    for (let i = 1; i <= n; i++) {
      result += options.fn(i);
    }
    return result;
  },
  individualTotal: function (a, b) {
    return a * b;
  },
  grandTotal: function (cartItems) {
    let totalPrice = 0;
    cartItems.forEach((element) => {
      const productPrice = element.product.price;
      const quantity = element.quantity;
      const itemTotal = productPrice * quantity;
      totalPrice += itemTotal;
    });
    return totalPrice;
  },
  oderTotal: function (cart) {
    let oderTotal = 0;
    cart.forEach((item) => {
      console.log(item);
      oderTotal += item.carted.price * item.quantity;
    });

    return oderTotal;
  },
  oderListTotal: function (a, b) {
    return a * b;
  },
  getFirstAddres: function (address) {
    if (address && address.length > 0) {
      return address[0]._id;
    } else {
      return "";
    }
  },
  first: function (arr) {
    return arr[0].productName;
  },
  second: function (arr) {
    return arr[0].quantity;
  },
  formatStandardTime: function (createdAt) {
    const formatedTime = new Date(createdAt).toLocaleString();
    return formatedTime;
  },
  idOderStatusPlacesOrCancelled: function (oderStatus) {
    return oderStatus === "placed" || oderStatus === "Cancel Declined";
  },
  categoryActive: function (a, b) {
    if (a == b) {
      return "active";
    } else {
      return "";
    }
  },
  equal: function (a, b) {
    console.log(a);
    console.log(b);
    const c = a.toString();
    console.log(c === b);
    return c === b;
  },
  slno: function (index) {
    return index + 1;
  },
  displayImage1: function (name) {
    return `/assests/${name[0]}`;
  },
  displayImage2: function (name) {
    return `/assests/${name[1]}`;
  },
  displayImage3: function (name) {
    return `/assests/${name[2]}`;
  },
  counts: function (a) {
    let array = [];
    for (let i = 0; i < a; i++) {
      array.push(i);
    }
    return array;
  },
  formatNumber: function (number) {
    let formatedNumber = new Intl.NumberFormat("en-IN").format(number);

    return formatedNumber;
  },
  showdate: function (dateString) {
    const date = new Date(dateString);

    let formatedDate = date.toISOString().split("T")[0];
    return formatedDate;
  },
  displayOffer: function (product) {
    if (product.offer == 0) {
      return false;
    }
    return true;
  },
  offcheck: function (off) {
    if (off !== 0) {
      return true;
    }
    return false;
  },
  realPrice: function (price) {
    if (price.category.offer !== 0 || price.offer !== 0) {
      return true;
    }
    return false;
  },
  json: function (data) {
    return JSON.stringify(data) || null;
  },
  show: function (show) {

  },
  or: function (a, b) {
    return a || b;
  },
  wishlistCheck: function (user, productId) {
    if (user && user[0].wishList) {
      for (let i = 0; i < user[0].wishList.length; i++) {
        const item = user[0].wishList[i];
        if (item.productId.toString() === productId.toString()) {
          return true;
        }
      }
    }

    return false;
  },
  checkUnavilable: function (a) {
  
    if (a.product.status != true) {
     
      return true;
    }
    return false;
  },
  wishListcheckUnavilable: function (b) {

    console.log(b);
    if (b.wishListed.status != true) {

      return true;
    }
   
    return false;
  },
};
