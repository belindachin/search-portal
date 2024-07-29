
import { useEffect, useState, KeyboardEvent, Dispatch, Fragment } from "react";
import { MdClear, MdSearch } from "react-icons/md";

// Number of suggestions to show in the dropdown
const nSuggestions: number = 6;

interface Suggestion {
  stemmedQueryTerm: string;
  suggestions: string[];
}

interface Highlight {
  BeginOffset: number;
  EndOffset: number;
}

interface DocumentText {
  Highlights: Highlight[];
  Text: string;
}

interface Result {
  Id: string | null;
  DocumentId: string;
  DocumentExcerpt: DocumentText;
  DocumentTitle: DocumentText;
  DocumentURI: string;
}

interface QueryResult {
  Page: number;
  PageSize: number;
  ResultItems: Result[];
  TotalNumberOfResults: number
}

/**
 * Returns suggestions from the Suggestions API.
*/
function GetSuggestions(queryString: string): Promise<Suggestion> {
  // TODO: Replace mocked API call with actual API call.
  const url = "https://gist.githubusercontent.com/yuhong90/b5544baebde4bfe9fe2d12e8e5502cbf/raw/e026dab444155edf2f52122aefbb80347c68de86/suggestion.json";
  return fetch(url)
  .then(resp => {
    if (resp.ok) {
      return resp.json();
    } else {
      throw new Error(`There was an error when getting suggestions for ${queryString}`);
    }
  })
  .catch(e => {
    throw new Error(`There was an error when getting suggestions for ${queryString}`);
  });
}

/**
 * Returns search results from the Search API.
 */
function GetSearchResult(searchTerm: string): Promise<QueryResult> {
  // TODO: Replace mocked API call with actual API call.
  const url = "https://gist.githubusercontent.com/yuhong90/b5544baebde4bfe9fe2d12e8e5502cbf/raw/44deafab00fc808ed7fa0e59a8bc959d255b9785/queryResult.json";
  return fetch(url)
  .then(resp => {
    if (resp?.ok) {
      return resp.json();
    } else {
      throw new Error(`There was an error getting search results for ${searchTerm}`);
    }
  })
  .catch(e => {
    throw new Error(`There was an error getting search results for ${searchTerm}`);
  });
}

/**
 * Bolds selected substrings.
 */
function BoldedText({ documentText } : { documentText: DocumentText }) {
  // Sort highlights by BeginOffset
  documentText.Highlights.sort((a, b) => {
    if (a.BeginOffset < b.BeginOffset) {
      return -1;
    } else {
      return 1;
    }
  });

  const highlights = documentText.Highlights;
  const text = documentText.Text;
  let currIndex: number = 0;

  return (
    <>{highlights.map((highlight, index) => {
      const el = (
        <Fragment key={index}>
          <span>{text.slice(currIndex, highlight.BeginOffset)}</span>
          <span style={{fontWeight: 700}}>
            {text.slice(highlight.BeginOffset, highlight.EndOffset)}
          </span>
        </Fragment>
      );
      currIndex = highlight.EndOffset;
      return el;
      })
    }
    <span>{text.slice(highlights[highlights.length - 1].EndOffset, text.length)}</span>
   </>
  );
}


function Dropdown(
  { show, suggestion, selectedIndex, handleSearch, setShowDropdown }:
  { show: boolean,
    suggestion: Suggestion | undefined,
    selectedIndex: number,
    handleSearch: Function,
    setShowDropdown: Dispatch<React.SetStateAction<boolean>>
  }) {

  /**
   * Returns search results when user clicks on a suggestion
   * in the suggestions dropdown
   */
  function handleSuggestionClick(suggestion: string) {
    handleSearch(suggestion);
    setShowDropdown(false);
    const inputEl = document.querySelector('input');
    if (inputEl) {
      inputEl.value = suggestion;
    }
  }

  const suggestions = suggestion?.suggestions;
  // Formats suggestions for the BoldedText function
  // to bold query term in suggestions dropdown
  const suggestionsText: DocumentText[] = [];
  if (suggestion && suggestions) {
    const queryTerm = suggestion.stemmedQueryTerm;
    suggestions.map(suggestion => {
      const index = suggestion.indexOf(queryTerm);
      if (index > -1) {
        const suggestionText = {
          Text: suggestion,
          Highlights: [
            {
              BeginOffset: index,
              EndOffset: index + queryTerm.length
            }
          ]
        };
        suggestionsText.push(suggestionText);
      }
      return null;
    });
  }

  return <>
    {(
      show && suggestions ?
      <div className="dropdown" title="Suggestions dropdown">
      {
        suggestions.map((suggestion, index) => {
          return (
            <div
              key={index}
              className={index === selectedIndex ? 'selected-element' : 'element'}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <BoldedText documentText={suggestionsText[index]} />
            </div>
          )
        })
      }
      </div> : null
    )}
  </>
}


function SearchBar({ handleSearch }: { handleSearch: Function }) {

  const [showClear, setShowClear] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | undefined>(undefined);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  function resetInput() {
    setShowClear(false);
    setSelectedIndex(-1);
    handleSearch("");
    setShowDropdown(false);
  }

  function handleSuggestions(searchTerm: string) {
    resetInput();
    if (searchTerm !== "" && searchTerm.length >= 1) {
      setShowClear(true);
    }
    if (searchTerm !== "" && searchTerm.length >= 2) {
      GetSuggestions(searchTerm)
      .then(suggestion => {
        suggestion.suggestions = suggestion.suggestions.slice(0, nSuggestions);
        setSuggestion(suggestion);
        setShowDropdown(true);
      })
      .catch(e => {
        console.error(e)
      });
    }
  }

  function handleClick(action: string) {
    const inputEl = document.querySelector('input');
    if (action === 'clear') {
      if (inputEl) {
        inputEl.value = "";
        setShowDropdown(false);
      }
      resetInput();
    }
    else if (action === "search") {
      if (inputEl) {
        handleSearch(inputEl.value);
        setShowDropdown(false);
      }
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    let newSelectedIndex = selectedIndex;
    if (e.key === 'ArrowDown') {
      newSelectedIndex = newSelectedIndex + 1;
      if (newSelectedIndex < nSuggestions) {
        setSelectedIndex(newSelectedIndex);
      }
    }
    if (e.key === 'ArrowUp') {
      newSelectedIndex = newSelectedIndex - 1;
      if (newSelectedIndex >= 0) {
        setSelectedIndex(newSelectedIndex);
      } else {
        setSelectedIndex(-1);
      }
    }
    if (e.key === 'Enter') {
      const inputEl = document.querySelector('input');
      console.log('hit enter', inputEl?.value);
      if (suggestion && selectedIndex >= 0 && selectedIndex < nSuggestions) {
        const newSearchTerm = suggestion.suggestions[selectedIndex];
        if (inputEl) {
          inputEl.value = newSearchTerm;
          setShowDropdown(false);
          handleSearch(newSearchTerm);
        }
      } else {
        setShowDropdown(false);
        handleSearch(inputEl?.value);
      }
    }
  }

  return (
    <div className="search-bar-background">
      <div className="search-bar">
        <input
          title="Search"
          type="text"
          className={showDropdown ? "dropdown-shown" : ""}
          onChange={(e) => handleSuggestions(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e)}
        />
        <button
          title="Clear button"
          className="clear"
          style={{visibility: showClear ? 'visible' : 'hidden'}}
          onClick={() => handleClick('clear')}
        >
          <MdClear />
        </button>
        <button
          title="Search button"
          className="search"
          onClick={() => handleClick('search')}
        >
          <span className="label">
            <MdSearch/> <span>Search</span>
          </span>
        </button>
      </div>
      <Dropdown
        show={showDropdown}
        suggestion={suggestion}
        selectedIndex={selectedIndex}
        handleSearch={handleSearch}
        setShowDropdown={setShowDropdown}
      />
    </div>
  )
}

function SearchResults({ searchTerm } : { searchTerm: string }) {
  const [queryResult, setQueryResults] = useState<QueryResult | undefined>(undefined);

  function Pagination({queryResult} : {queryResult: QueryResult | undefined}) {
    if (queryResult) {
      const total = queryResult.TotalNumberOfResults;
      if (total > 0) {
        let start: number;
        if (queryResult.Page === 1) {
          start = 1;
        } else {
          start = (queryResult.Page-1) * queryResult.PageSize;
        }
        const end = queryResult.Page * queryResult.PageSize;
        return (
          <div className="pagination-info">
            <span>Showing {start}-{end} of {total} results</span>
          </div>
        )
      } else {
        return (
          <div className="pagination-info">
            <span style={{whiteSpaceCollapse: 'preserve'}}>No results found for '{searchTerm}'</span>
          </div>
        )
      }
    }
    return null;
  }

  function SearchResult({result} : {result: Result}) {
    return (
      <div className="search-result">
        <div className="title">
          <span>{result.DocumentTitle.Text}</span>
        </div>
        <div className="excerpt">
          <BoldedText documentText={result.DocumentExcerpt} />
        </div>
        <div className="uri">
          <a href={result.DocumentURI}>{result.DocumentURI}</a>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (searchTerm !== "") {
      GetSearchResult(searchTerm)
      .then(queryResult => setQueryResults(queryResult))
      .catch(e => {
        console.error(e);
        const emptyQueryResult = {
          Page: 0,
          PageSize: 0,
          ResultItems: [],
          TotalNumberOfResults: 0
        };
        // Displays a message saying no search results were found
        // for the search term provided
        setQueryResults(emptyQueryResult);
      });
      return () => {};
    } else {
      // No search results should be returned if no search term was provided
      setQueryResults(undefined);
    }
  }, [searchTerm]);

  return (
    <div className="search-results" data-testid="search-results">
      <Pagination queryResult={queryResult} />
      {queryResult?.ResultItems.map((result) => {
        return <SearchResult key={result.DocumentId} result={result} />
      })}
    </div>
  )
}


export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');

  function handleSearch(searchTerm: string): void {
    setSearchTerm(searchTerm);
  }

  return (
    <div className="search">
      <SearchBar handleSearch={handleSearch}/>
      <SearchResults searchTerm={searchTerm} />
    </div>
  )
}