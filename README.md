# gatsby-source-gitdiff

A source plugin that creates Diff nodes from a local git repo. Each Diff is generated by diffing two adjacent commits using [git-diff](https://git-scm.com/docs/git-diff). A key use case would be to create a change-log section showing the history of changes to your site.

**Important**: Your git repo must be at the root of your Gatsby project. 

**Also Important**: No Diff nodes will be produced if you only have one commit in your history (and this will probably produce a "no nodes found" error in graphql queries).


## Install

```
npm install --save gatsby-source-gitdiff
```


## How to use

```javascript
// In your gatsby-config.js
module.exports = {
  plugins: [
    {
      resolve: `gatsby-source-gitdiff`,
      options: {
        ...
      },
    },
  ],
}
```

## Options

See [defaultOptions.js](./lib/defaultOptions.js) for defaults to each option.

```javascript
options: {
  "diffFilter" : "ADM",                     // (string) A = Added, D = Deleted, M = Modified (fed into --diff-filter option of git-diff command)
  "dateFormat" :  "MMM DD, YYYY - h:mm a",  // (string) momentjs formatting string, would produce "Oct 08, 2018 - 12:34 am"
  "targetDirectory"  : "src/pages",         // (string) only include diff'ed files in this directory
  "afterCommit" : "017180a",                // (string) start comparing after this commit
  "ignore" : 
  {
    "firstCommit" : false,                  // (bool) ignore the first commit
    "files" : ["package.json"],             // (string[]) file names to exclude
    "exts" : ["png"],                       // (string[]) file extensions to exclude
    "commits" : ["017180a"],                // (string[]) hashes of commits to exclude
  }
}
```


## Diff Node

The format of a Diff node is as follows:

```javascript
{
  "node": {
    "date": "Nov 12, 2018 - 12:31 pm",  // The date of the commit
    "message": "Updated home page",     // The commit message (i.e. git commit -m"Updated home page")
    "files": [                          // An array of files that have changed
      {
        "name": "src/pages/index.js",   // Filepath of file
        "binary": false,                // Whether the file is a binary
        "type": "modified",             // What type of change occured (e.g. added, modified, deleted)
        "changes": [                    // An array of diff-formatted strings
          "-  this\n+ that"
        ]
      }
    ]
  }
}
```


## How to query

A query for Diff nodes would look like:

```
{
  allGitDiffCommit {
    edges {
      node {
        date
        message
        files {
          name
          binary
          type
          changes
        }
      }
    }
  }
}
```

and this would produce a result like:

```
{
  "data": {
    "allGitDiffCommit": {
      "edges": [
        {
          "node": {
            "date": "Nov 12, 2018 - 12:31 pm",
            "message": "Updated home page",
            "files": [
              {
                "name": "src/pages/index.js",
                "binary": false,
                "type": "modified",
                "changes": [
                  " import Image from '../components/image'\n \n const IndexPage = () => (\n   <Layout>\n-    <h1>Hi people</h1>\n+    <h1>Hello everyone!</h1>\n     <p>Welcome to your new Gatsby site.</p>\n     <p>Now go build something great.</p>\n     <div style={{ maxWidth: '300px', marginBottom: '1.45rem' }}>\n"
                ]
              }
            ]
          }
        }
      ]
    }
  }
}
````