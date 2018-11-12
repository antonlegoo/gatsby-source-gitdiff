
module.exports = 
{
	"diffFilter" : "ADM",					// (string) A = Added, D = Deleted, M = Modified (fed into --diff-filter option of git-diff command)
	"dateFormat" :  "MMM DD, YYYY - h:mm a",	// (string) momentjs formatting string, would produce "Oct 08, 2018 - 12:34 am"
	"targetDirectory"  : "src/pages",		// (string) only include diff'ed files in this directory
	"afterCommit" : null,					// (string) start comparing after this commit, e.g. 017180a
	"ignore" : 
	{
		"firstCommit" : false,				// (bool) ignore the first commit
		"files" : [],						// (string[]) file names to exclude, e.g 'package.json'
		"exts" : [],						// (string[]) file extensions to exclude, e.g. 'png'
		"commits" : [],						// (string[]) hashes of commits to exclude, e.g '017180a'
	}
};