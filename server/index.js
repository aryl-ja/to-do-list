import express from 'express';
import { db } from './db.js';

const app = express();
//parse json
app.use(express.json());
const PORT = 3000;

//get-accounts
app.get('/get-accounts', (req,res) => {
 const query = "SELECT * FROM accounts";
 db.query(query)
 .then(accounts => {
  res.status(200).json({ accounts: accounts.rows });
});
});

//get-titles
app.get('/get-titles', (req,res) => {
 const query = "SELECT * FROM titles";
 db.query(query)
 .then(titles => {
  res.status(200).json({ titles: titles.rows });
});
});

//get-lists
app.get('/get-lists', (req,res) => {
 const query = "SELECT * FROM lists";
 db.query(query)
 .then(lists => {
  res.status(200).json({ lists: lists.rows });
});
});

app.post('/check-accounts', (req, res) => {
  const { username, password } =  req.body;

  const query ="SELECT * FROM users WHERE username=$1 AND password=$2";

  db.query(query, [username, password])
  .then(result => {
    if(result.rowCount > 0) {
     res.status(200).json({ exist: true});
  }
  else{
    res.status(200).json({ exist: false});
  }
});
});

app.post('/register', (req, res) => {
  const { username, password, fname, lname } = req.body;

  const query ="INSERT INTO accounts (username, password, fname, lname) VALUES ($1,$2,$3,$4)";
  db.query(query, [username, password, fname, lname])
  .then(result => {
    res.status(200).json({ success: true });
  });
});

app.post('/add-to-do', (req, res) => {
    const { username, title, lists } = req.body;
    const date_modified = new Date().toISOString().split('T')[0];
  
    const titleQuery = "INSERT INTO titles (username, title, date_modified, status) VALUES ($1, $2, $3, true) RETURNING id";
    
    db.query(titleQuery, [username, title, date_modified])
      .then(result => {
        const title_id = result.rows[0].id;
  
        const listQueries = lists.map(task =>
          db.query("INSERT INTO lists (title_id, list_desc, status) VALUES ($1, $2, true)", [title_id, task])
        );
  
        return Promise.all(listQueries);
      })
      .then(() => {
        res.status(200).json({ success: true, message: "Succesfully Added" });
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({ success: false, message: "Error adding To-Do List" });
      });
  });

  app.post('/update-todo', (req, res) => {
    const { title_id, list } = req.body;
    const date_modified = new Date().toISOString().split('T')[0];

    const updateTitleQuery = "UPDATE titles SET date_modified = $1 WHERE id = $2";
    db.query(updateTitleQuery, [date_modified, title_id])
      .then(() => {
        const deleteListsQuery = "DELETE FROM lists WHERE title_id = $1";
        return db.query(deleteListsQuery, [title_id]);
      })
      .then(() => {
        const insertListQueries = list.map(task =>
          db.query("INSERT INTO lists (title_id, list_desc, status) VALUES ($1, $2, true)", [title_id, task])
        );
        return Promise.all(insertListQueries);
      })
      .then(() => {
        res.status(200).json({ success: true, message: "To-do Successfully Updated" });
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({ success: false, message: "Error updating To-Do List" });
      });
});

app.post('/delete-todo', (req, res) => {
    const { title_id } = req.body;

    try{
      //Delete all lists under the title
      const deleteListsQuery="DELETE FROM lists WHERE title_id=$1";
     db.query(deleteListsQuery,[title_id]);

      //Delete the title itself
      const deleteTitleQuery="DELETE FROM lists WHERE id = $1";
     db.query(deleteListsQuery,[title_id]);

      res.status(200).json({success:true,message:"To-do Successfully Deleted"});
    }catch(error){
      console.error(error);
      res.status(500).json({success:false,message:"Error deleting To-Do list"});
    }
    });

app.post('/update-status', (req, res) => {
  const { title_id,list_id,status} = req.body;

  if(title_id, list_id, status ===undefined, status===undefined) {
    return res.status(400).json({message:"invalid request data"});
  }
  const updateStatusQuery ="UPDATE lists SET status = $1 WHERE title_id =$2 AND id = $3;"
  db.query(updateStatusQuery,[status,title_id,list_id])
  .then(() => {
    res.status(200).json({success:true,message:"List status successfully updated"});
  })
  .catch(error => {
    res.status(500).json({success:false,message:"Error updating list status"});
  });
});

app.listen(PORT, () => {
 console.log(`Server is running on Port ${PORT}`);
});
