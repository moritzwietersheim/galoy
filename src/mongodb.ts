import { exit } from "process"

const mongoose = require("mongoose");
// mongoose.set("debug", true);

const Schema = mongoose.Schema;

// could be capped after X months.
// as this could be reconstructure from the ledger
// and old non pending transaction would not really matters
const invoiceUserSchema = new Schema({
  _id: String, // hash of invoice
  uid: String,
  pending: Boolean,
  timestamp: {
    type: Date,
    default: Date.now
  },
})

// TOOD create indexes

mongoose.model("InvoiceUser", invoiceUserSchema)


const UserSchema = new Schema({
  created_at: {
    type: Date,
    default: Date.now
  },
  earn: [String],
  role: {
    type: String,
    enum: ["user", "admin"],
    required: true,
    default: "user"
  },
  onchain_addresses: [String],
  level: Number,
  phone: String, // TODO we may want to store country as a separate string
  // firstName,
  // lastName,
  // activated,
  // deviceToken
  // etc
})

// TOOD create indexes

mongoose.model("User", UserSchema)


// TODO: this DB should be capped.
const PhoneCodeSchema = new Schema({
  created_at: {
    type: Date,
    default: Date.now
  },
  phone: Number,
  code: Number,
})

mongoose.model("PhoneCode", PhoneCodeSchema)


const transactionSchema = new Schema({
  // custom property
  currency: {
    type: String,
    enum: ["USD", "BTC"],
    required: true
  },
  hash: {
    type: Schema.Types.String,
    ref: 'InvoiceUser'
    // TODO: not always, use another hashOnchain?

    // required: function() {
    //   return this.currency === "BTC"
    //   a ref only for Invoice. otherwise the hash is not linked
    // }
  },
  txid: String,
  type: {
    type: String,
    enum: ["invoice", "payment", "earn", "onchain_receipt", "fee", "escrow", "on_us"]
  },
  pending: Boolean, // duplicated with InvoiceUser for invoices
  err: String,

  // original property from medici
  credit: Number,
  debit: Number,
  meta: Schema.Types.Mixed,
  datetime: Date,
  account_path: [String],
  accounts: String,
  book: String,
  memo: String,
  _journal: {
    type: Schema.Types.ObjectId,
    ref: "Medici_Journal"
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  voided: {
    type: Boolean,
    default: false
  },
  void_reason: String,
  // The journal that this is voiding, if any
  _original_journal: Schema.Types.ObjectId,
  approved: {
    type: Boolean,
    default: true
  }
})

// TODO indexes, see https://github.com/koresar/medici/blob/master/src/index.js#L39
mongoose.model("Medici_Transaction", transactionSchema);



const priceSchema = new Schema({
  // TODO:
  // split array in days instead of one big array. 
  // More background here: 
  // https://www.mongodb.com/blog/post/time-series-data-and-mongodb-part-2-schema-design-best-practices
  _id: {
    type: Date, // TODO does _id would prevent having several key (ie: Date) for other exchanges?
    unique: true
  },
  o: Number, // opening price
})

// price History
const priceHistorySchema = new Schema({
  pair: {
    name: {
      type: String,
      enum: ["BTC/USD"]
    },
    exchange: {
      name: {
        type: String,
        // enum: ["kraken"], // others
      },
      price: [priceSchema],
    }
  }
})
mongoose.model("PriceHistory", priceHistorySchema);


// TODO add an event listenever if we got disconnecter from MongoDb
// after a first succesful connection

export const setupMongoConnection = async () => {
  const user = process.env.MONGODB_USER ?? "testGaloy"
  const password = process.env.MONGODB_ROOT_PASSWORD ?? "testGaloy"
  const address = process.env.MONGODB_ADDRESS ?? "mongodb"
  const db = process.env.MONGODB_DATABASE ?? "galoy"
  
  const path = `mongodb://${user}:${password}@${address}/${db}`
  // console.log({path})

  try {
    await mongoose.connect(path, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    })
  } catch (err) {
    console.error(`error connecting to mongodb ${err}`)
    exit(1)
  }
}