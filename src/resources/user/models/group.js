import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    }]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const Group = mongoose.model("Group", groupSchema);
export default Group;
