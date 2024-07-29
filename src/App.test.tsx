import { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from './App';


test('loads and renders search bar', () => {
  render(<App />);
  const input = screen.getByRole("textbox", {name: "Search"});
  expect(input).toBeInTheDocument();
});

test('loads and renders search bar with an empty value', () => {
  render(<App />);
  const input = screen.getByRole("textbox", {name: "Search"});
  expect(input.nodeValue).toBeNull();
});

test('loads and renders search button', () => {
  render(<App />);
  const searchButton = screen.getByRole('button', {name: "Search"});
  expect(searchButton).toBeInTheDocument();
});

test('when the search bar input has more than or equal 2 non-whitespace characters, a dropdown appears with search suggestions', async () => {
  render(<App />);
  await act(async () => {
    const input = screen.getByRole("textbox", {name: "Search"});
    fireEvent.change(input, {target: {value: "ch"}});
  });
  const suggestions = await screen.findByRole("generic", {name: "Suggestions dropdown"});
  expect(suggestions).toBeVisible();
});

test('when the search bar input has less than 2 characters, a dropdown appears with search suggestions', async () => {
  render(<App />);
  await act(async () => {
    const input = screen.getByRole("textbox", {name: "Search"});
    fireEvent.change(input, {target: {value: "c"}});
  });
  const suggestions = await screen.queryByRole("generic", {name: "Suggestions dropdown"});
  expect(suggestions).toBeNull();
});

test('when the search bar is empty, clicking on search returns no search results', async () => {
  render(<App />);
  await act(async () => {
    userEvent.click(screen.getByRole('button', {name: 'Search'}));
  });
  const searchResults = await screen.queryByText(/showing/i);
  expect(searchResults).toBeNull();
});

test('when the search bar input has at least one non-whitespace character, clicking on search returns search results', async () => {
  render(<App />);
  await act(async () => {
    const input = screen.getByRole("textbox", {name: "Search"});
    fireEvent.change(input, {target: {value: "c"}});
    userEvent.click(screen.getByRole('button', {name: 'Search'}));
  });
  const searchResults = await screen.findByText(/showing/i);
  expect(searchResults).toBeInTheDocument();
});

test('when the search bar input only has whitespace characters, clicking on search returns no search results', async () => {
  render(<App />);
  await act(async () => {
    const input = screen.getByRole("textbox", {name: "Search"});
    fireEvent.change(input, {target: {value: "    "}});
    userEvent.click(screen.getByRole('button', {name: 'Search'}));
  });
  const noResultsFound = await screen.findByText(/No results found/i);
  expect(noResultsFound).toBeDefined();
});

test('when the search bar input is empty, the clear button does not appear', async () => {
  render(<App />);
  await act(async () => {
    const input = screen.getByRole("textbox", {name: "Search"});
    fireEvent.change(input, {target: {value: ""}});
  });
  const clearButton = await screen.queryByRole("button", {name: "Clear button"});
  expect(clearButton).toBeNull();
});

test('when the search bar input is not empty, the clear button appears', async () => {
  render(<App />);
  await act(async () => {
    const input = screen.getByRole("textbox", {name: "Search"});
    fireEvent.change(input, {target: {value: "test"}});
  });
  const clearButton = await screen.findByRole("button", {name: "Clear button"});
  expect(clearButton).toBeInTheDocument();
});

test('clicking on the clear button clears the input in the search bar', async () => {
  render(<App />);
  const input = screen.getByRole("textbox", {name: "Search"});
  await act(async () => {
    fireEvent.change(input, {target: {value: "test"}});
    const clearButton = await screen.findByRole("button", {name: "Clear button"});
    userEvent.click(clearButton);
  });
  expect(input.nodeValue).toBeNull();
});