const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//Validation Middleware
//First, order exist?
function orderExists(req, res, next) {
  const { orderId } = req.params;
  res.locals.order = orders.find((order) => order.id === orderId);

  if (res.locals.order) {
    return next();
  } else {
    next({ status: 404, message: `order ${orderId} does not exist` });
  }
}

//Various checks on the order properties
function orderProper(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes, id } = {} } =
    req.body;
  const { orderId } = req.params;
  const validStatus = ["pending", "delivered", "preparing", "out-for-delivery"];
  //If that filters get requests
  if (req.method == "PUT") {
    //Prop missing, empty, or weird
    if (!status || status === "" || !validStatus.includes(status)) {
      next({
        status: 400,
        message:
          "Order must have a status of pending, preparing, out-for-delivery, delivered",
      });
    }
    //Delivered status means too late
    else if (status === "delivered") {
      next({ status: 400, message: "A delivered order cannot be changed" });
    }
    //body id not match
    else if (id) {
      if (orderId != id) {
        next({
          status: 400,
          message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
        });
      }
    }
    //store
    else {
      res.locals.status = status;
      res.locals.id = orderId;
    }
  }
  //Error messages for required info
  if (!deliverTo || deliverTo === "") {
    return next({ status: 400, message: "Order must include a deliverTo" });
  } else if (!mobileNumber || mobileNumber === "") {
    return next({ status: 400, message: "Order must include a mobileNumber" });
  } else if (!dishes) {
    return next({ status: 400, message: "Order must include a dish" });
  } else if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }
  //quantity check
  else {
    dishes.forEach((dish, index) => {
      const { quantity } = dish;
      if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
        return next({
          status: 400,
          message: `Dish ${index} must have a quantity that is an integer greater than 0`,
        });
      }
    });
  }
  //store and next
  let l = res.locals;
  l.deliverTo = deliverTo;
  l.mobileNumber = mobileNumber;
  l.dishes = dishes;
  l.status = status;
  next();
}

//Pending check prior to deleting
function pendingValidator(req, res, next) {
  const order = res.locals.order;
  if (order.status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  } else {
    next();
  }
}

const list = (req, res) => {
  res.json({ data: orders });
};

const read = (req, res) => {
  const order = res.locals.order;
  res.json({ data: order });
};

function create(req, res) {
  const l = res.locals;
  const newOrder = {
    id: nextId(),
    deliverTo: l.deliverTo,
    mobileNumber: l.mobileNumber,
    status: l.status,
    dishes: l.dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function update(req, res) {
  let l = res.locals;
  const { orderId } = req.params;
  const newOrder = orders.find((order) => {
    if ((order.id = orderId)) {
      (order.id = orderId),
        (order.status = l.status),
        (order.deliverTo = l.deliverTo),
        (order.mobileNumber = l.mobileNumber),
        (order.dishes = l.dishes);
    }
    return order;
  });
  res.status(200).json({ data: newOrder });
}

function destroy(req, res) {
  const index = orders.findIndex((order) => order.id === order.id);
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [orderProper, create],
  update: [orderExists, orderProper, update],
  delete: [orderExists, pendingValidator, destroy],
};
