let differ = require( "./lib/differ.js" );
let _ = require("lodash");
let colors = require('colors');

///////////////////////////////////////////////////////////
//  Get the commits
///////////////////////////////////////////////////////////

exports.sourceNodes = (
	{ actions, createNodeId, createContentDigest },
	configOptions
) => 
{
	const { createNode } = actions

	// Gatsby adds a configOption that's not needed for this plugin, delete it
	delete configOptions.plugins;

	// Helper function that processes a commit to match Gatsby's node structure
	const processCommit = commit => 
	{
		// Get the id of the node
		const nodeId = createNodeId( `gitdiff-commit-${commit.commit}` );

		// Stringify the commit content
		const nodeContent = JSON.stringify( commit );

		// Create node object from commit data
		const nodeData = Object.assign( {}, commit, 
		{
			id: nodeId,
			parent: null,
			children: [],

			message: commit.message,
			date: commit.date,
			files: commit.files,
			
			internal: 
			{
				type: `GitDiffCommit`,
				content: nodeContent,
				contentDigest: createContentDigest(commit),
			},
		});
		return nodeData;
	};

	// Combine options from config + default options
	let options = ( configOptions ) ? _.merge( differ.defaultOptions, configOptions ) : differ.defaultOptions;

	try
	{
		// Process commits
		let commits = differ.diff( options );

		// For each commit, process and make a node
		_.each( commits, c => createNode( processCommit( c ) ) );
	}
	catch( e )
	{
		console.log( '\nerror'.red, "\tGitDiff Error: ", e.message );
	}

	// Debug
	// console.log("GitDiffCommit", commits );
}