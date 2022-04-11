const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//Validation checker for dish info
function isProperChecks(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  if (!name || name === "") {
    next({ status: 400, message: "Dish must include a name" });
  } else if (!description || description == "") {
    next({ status: 400, message: "Dish must include a description" });
  } else if (!price) {
    next({ status: 400, message: "Dish must include a price" });
  } else if (!image_url || image_url == "") {
    next({ status: 400, message: "Dish must include a image_url" });
  } else if (!Number.isInteger(price) || Number(price) <= 0) {
    next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  } else {
    let l = res.locals;
    l.name = name;
    l.description = description;
    l.price = price;
    l.image_url = image_url;
    next();
  }
}

//EXISTENCE IS REQUIRED!
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const dish = dishes.find((dish, index) => {
    if (dish.id === dishId) {
      res.locals.foundDishIndex = index;
      return dish;
    }
  });
  if (!dish) {
    next({
      status: 404,
      message: `dish ${dishId} does not exist`,
    });
  } else {
    res.locals.dish = dish;
    next();
  }
}

function read(req, res, next) {
  if (res.locals.dish) {
    res.status(200).json({ data: res.locals.dish });
  } else {
    next({ status: 404 });
  }
}

function create(req, res, next) {
  const newId = nextId();
  let l = res.locals;
  const newDish = {
    id: newId,
    name: l.name,
    description: l.description,
    price: l.price,
    image_url: l.image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function list(req, res, next) {
  res.status(200).json({ data: dishes });
}

function update(req, res, next) {
  const { dishId } = req.params;
  const {
    data: { id },
  } = req.body;

  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Url id ${dishId} does not match request body id ${id}.`,
    });
  }

  if (res.locals.dish) {
    let l = res.locals;
    const newDish = dishes.find((dish) => {
      if (dish.id === dishId) {
        dish.name = l.name;
        dish.description = l.description;
        dish.price = l.price;
        dish.image_url = l.image_url;
      }
      return dish;
    });
    res.status(200).json({ data: newDish });
  } else {
    next({ status: 404 });
  }
}

module.exports = {
  list,
  create: [isProperChecks, create],
  read: [dishExists, read],
  update: [dishExists, isProperChecks, update],
};
