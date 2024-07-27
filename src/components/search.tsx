

function SearchBar() {
  return (
    <div className="search-bar">
      <p>search bar goes here</p>
    </div>
  )
}

function SearchResults() {
  return (
    <div className="search-results">
      <p>search results go here</p>
    </div>
  )
}

export default function Search() {
  return (
    <div className="search">
      <SearchBar />
      <SearchResults />
    </div>
  )
}