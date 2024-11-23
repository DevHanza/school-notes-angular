const express = require("express");
const router = express.Router();

const { ObjectId } = require("mongodb");
const conn = require("../db/connection.js");
const notesCollection = conn.notesCollection;
const subjectsCollection = conn.subjectsCollection;

router
  .route("/")
  .get(async (req, res) => {
    // Get All Notes

    const pipeline = [
      {
        $lookup: {
          from: "subjects",
          localField: "subject_id",
          foreignField: "_id",
          as: "subject_results",
        },
      },
      {
        $addFields: {
          subject: {
            $arrayElemAt: ["$subject_results", 0],
          },
        },
      },
      {
        $unset: "subject_results",
      },
    ];

    const result = await notesCollection.aggregate(pipeline).toArray();
    res.json(result);
  })

  // Create New Note
  .post(async (req, res) => {
    const result = await notesCollection.insertOne(req.body);
    res.json(req.body);
  });

router
  .route("/:id")
  // Get Note by ID
  .get(async (req, res) => {
    const noteID = Number(req.params.id);

    const pipeline = [
      {
        $match: {
          ID: noteID,
        },
      },
      {
        $lookup: {
          from: "subjects",
          localField: "subject_id",
          foreignField: "_id",
          as: "subject_results",
        },
      },
      {
        $addFields: {
          subject: {
            $arrayElemAt: ["$subject_results", 0],
          },
        },
      },
      {
        $unset: "subject_results",
      },
    ];

    const result = await notesCollection.aggregate(pipeline).toArray();

    res.json(result);
  })
  // Update Note by ID
  .patch(async (req, res) => {
    // DON'T use req.params.id, Since it can have duplicated Id's
    const noteObjectID = String(req.body.noteObjectId);
    const subjectObjectId = String(req.body.subjectObjectId);

    const filter = { _id: new ObjectId(noteObjectID) };

    const result = await notesCollection.updateOne(filter, {
      $set: {
        subject_id: new ObjectId(subjectObjectId),
        title: req.body.title,
        content: req.body.content,
      },
    });

    res.json(result);
  })

  // Delete Note by ID
  .delete(async (req, res) => {
    const noteID = req.params.id; // Keep it as a String: Because _id is a string in Mongodb
    const result = await notesCollection.deleteOne({
      _id: new ObjectId(noteID),
    });

    res.json({ result });
  });

module.exports = router;
