# rdf-editor
proof of concept. rdf-editor for power users

Out goal is to create an rdf editor that uses autocomplete and keyboard shortcuts to speed up and clean up item entry.

## Right Now
The demo runs as a simple webpage. It will work as long as it is being delivered by a server (the config won't load over file:///).

**Subjects** are not controlled are completed at all. Blank nodes are going to be handled, but we're not sure how yet.

**Predicates** are autocompleted from config JSONs. They automatically react to prefixes if you type, say, `foaf:`.

**Objects** are autocompleted from a server. You can navigate the options with the arrow keys, you can also navigate left and right on certain items to navigate broader and narrower terms, respectively.

## Coming Soon
Remove dev styling.

Saving to an rdf format