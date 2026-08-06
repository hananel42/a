import { useState, useEffect, useCallback, RefObject } from "react";

export function useSearchReplace(
  content: string,
  onChange: (val: string) => void,
  textareaRef: RefObject<HTMLTextAreaElement | null>,
) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [searchIndices, setSearchIndices] = useState<number[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Search logic
  useEffect(() => {
    if (!searchQuery) {
      setSearchIndices([]);
      return;
    }
    const indices: number[] = [];
    let idx = -1;
    const searchTarget = matchCase ? content : content.toLowerCase();
    const query = matchCase ? searchQuery : searchQuery.toLowerCase();

    while ((idx = searchTarget.indexOf(query, idx + 1)) !== -1) {
      indices.push(idx);
    }
    setSearchIndices(indices);
    if (activeIndex >= indices.length) {
      setActiveIndex(Math.max(0, indices.length - 1));
    }
  }, [content, searchQuery, matchCase, activeIndex]);

  // Focus effect for active index
  useEffect(() => {
    if (searchOpen && searchIndices.length > 0 && textareaRef.current) {
      const idx = searchIndices[activeIndex];
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(idx, idx + searchQuery.length);
      // Rough scroll into view calculation for textarea
      const linesBefore = content.substring(0, idx).split("\n").length;
      textareaRef.current.scrollTop = (linesBefore - 5) * 21; // Assuming 21px line height
    }
  }, [
    activeIndex,
    searchIndices,
    searchOpen,
    searchQuery.length,
    textareaRef,
    content,
  ]);

  const handleNextSearch = useCallback(() => {
    if (searchIndices.length > 0) {
      setActiveIndex((prev) => (prev + 1) % searchIndices.length);
    }
  }, [searchIndices.length]);

  const handlePrevSearch = useCallback(() => {
    if (searchIndices.length > 0) {
      setActiveIndex(
        (prev) => (prev - 1 + searchIndices.length) % searchIndices.length,
      );
    }
  }, [searchIndices.length]);

  const handleReplace = useCallback(() => {
    if (searchIndices.length > 0) {
      const idx = searchIndices[activeIndex];
      const newContent =
        content.substring(0, idx) +
        replaceQuery +
        content.substring(idx + searchQuery.length);
      onChange(newContent);
    }
  }, [
    activeIndex,
    searchIndices,
    content,
    replaceQuery,
    searchQuery.length,
    onChange,
  ]);

  const handleReplaceAll = useCallback(() => {
    if (searchQuery) {
      let newContent = content;
      if (matchCase) {
        newContent = content.split(searchQuery).join(replaceQuery);
      } else {
        const regex = new RegExp(
          searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "gi",
        );
        newContent = content.replace(regex, replaceQuery);
      }
      onChange(newContent);
    }
  }, [content, searchQuery, replaceQuery, matchCase, onChange]);

  return {
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    replaceQuery,
    setReplaceQuery,
    matchCase,
    setMatchCase,
    searchIndices,
    activeIndex,
    handleNextSearch,
    handlePrevSearch,
    handleReplace,
    handleReplaceAll,
  };
}
