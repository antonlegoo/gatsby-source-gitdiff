let execSync = require( "child_process" ).execSync;
let _ = require("lodash");
let moment = require("moment");

let defaultOptions = require( "./defaultOptions.js" );

module.exports = 
{
	"defaultOptions" : defaultOptions,

	"diff" : function( options )
	{
		// console.time("Formatting commits took");

		///////////////////////////////////////////////////////////
        //  Get the commits
        ///////////////////////////////////////////////////////////
        // Get the commits, which returns something like:
        //      708aaa2 Update README.md
        //      dc8422a Initial commit.

        // git log --pretty=format:"%h %ct %s" 8914959...HEAD
        let command = ( options.afterCommit )   ? `git log --pretty=format:"%h %ct %s" ${options.afterCommit}...HEAD`
                                                : `git log --pretty=format:"%h %ct %s"`;

        let commitLines = execSync( command, { "encoding" : "utf8" } )
                            // Make it an array by breaking it by newlines
                            .split("\n");

        // Sort from oldest to newest
        commitLines.reverse();

        // Get an array of just the hashes
        let commits = _.map( commitLines, function(c) { 
                                                    let split = c.split(" ");
                                                    let commit = split[0];
                                                    let date = moment.unix( split[1] ).toJSON();
                                                    let message = c.replace(`${commit} ${split[1]} `, "");
                                                    return { "commit" : commit, "message" : message, "date" : moment(date).format(options.dateFormat) } 
                                                }.bind(this) 
                            )
                            // Filter out any nulls
                            .filter( (c)=> c.commit.length > 0 );

        // Throw errors if not enough commits
        if( commits.length == 0 ) throw new Error( "no commits found – not enough to make a single diff" );
        else if( commits.length == 1 ) throw new Error( "only one commit found – not enough to make a single diff" );

        ///////////////////////////////////////////////////////////
        //  For each commit, get the files that have changed
        ///////////////////////////////////////////////////////////

        commits = _.map( commits, (c,i) => 
        {
        	// Skip first
        	if( i==0 ) return;
            // Build the command
            let c1 = commits[i-1]['commit'];
            let c2 = commits[i]['commit'];

            // Get a list of changed files only from target directory
            let result = execSync( `git diff --diff-filter=${options.diffFilter} ${c1} ${c2} --name-only -- '${options.targetDirectory}'`, { "encoding" : "utf8" } );

            // Convert to list of file names
            let files = result.split("\n");
            files.pop();    // Last item is always null, so remove it

            // Filter out files based on ignore options
            _.remove( files, f=> {
                // Remove if its a filename we should ignore
                let excludedFile = _.indexOf(options.ignore.files, f) != -1;
                // Remove if its a file extension we should ignore
                let excludedExt = _.indexOf(options.ignore.exts, f.split(".")[1]) >= 0;
                // 
                return excludedFile || excludedExt;
            });

            // For each file, make a diff
            c.files = _.map( files, f => 
            {
                // Get a diff for the file
                let diff = execSync( `git diff --diff-filter=${options.diffFilter} ${c1} ${c2} -- ${f}`, { "encoding" : "utf8" } );
                // Return a formatted object for the diff
                return this.formatDiffedFile( f, diff );
            });

            // Return
            return c;
        });

        ///////////////////////////////////////////////////////////
        //  Remove commits that aren't needed
        ///////////////////////////////////////////////////////////

        // Remove nulls
        _.remove( commits, c => !c );

        // Remove the first (initial) commit
        if( options.ignore.firstCommit ) commits.shift();

        // Remove commits with no files (e.g. they've all been ignored)
        commits = _.filter( commits, (c)=> c.files.length > 0 );

        // Remove ignored commits
        if( options.ignore.commits.length > 0 ) 
            commits = _.filter( commits, (c)=> !_.find( options.ignore.commits, i=> i == c.commit) );

        // Re-order to latest commit first
        commits.reverse();

        // Debug
        // _.each( commits, c => console.log( c.commit, c.message ) );

		///////////////////////////////////////////////////////////
        //  Return
        ///////////////////////////////////////////////////////////

        // Throw errors if not enough commits
        if( commits.length == 0 ) throw new Error( "commits were found but all were removed after filtering" );

        // console.timeEnd("Formatting commits took");

		return commits;
	},

    // Returns the diff as a formatted object
    formatDiffedFile ( filename, diff )
    {
        return {
                    "name" : filename,
                    "binary" : this.isBinaryFile( diff ),
                    "type" : this.getDiffType( diff ), 
                    "changes" : this.cleanUpDiff( diff ) 
                };
    },

    // removes formatting for easier parsing
	"cleanUpDiff" : function ( diff ) {

		// Remove the meta-info at the top part of the diff
		diff = diff.replace( diff.substring( 0, diff.indexOf("@@")+2 ), "" );
		// Remove the @@ line
		diff = diff.replace( diff.substring( 0, diff.indexOf("@@")+2 ), "" );
		// Split by @@
		diff = diff.split(/^(@@.*@@)/gm);
		// For some reason regex split doesnt remove delmiter
		diff = _.filter( diff, (e,i)=> i%2 == 0 );

		// console.log( typeof diff, diff.length, diff, "\n\n\n\n\n" );
		return diff;
	},

    // Determines whether diff is an Add, Delete or Update
	"getDiffType" : function( diff ) {
		if( diff.indexOf("new file mode") > -1 ) return "added";
		else if( diff.indexOf("deleted file mode") > -1 || diff.length == 0 ) return "deleted";
		else return "modified";
	},

    // Determines whether a diff is for a binary file
    "isBinaryFile" : function( diff ) {
        return ( diff.search(/(Binary files).*(differ)/gm) > -1 );
    },
}