"use client";

import React, { useEffect, useState } from "react";

export default function WikiPanel({ location }) {
  const [wikiData, setWikiData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!location) {
      setWikiData(null);
      return;
    }

    const fetchWikiData = async () => {
      setIsLoading(true);
      setWikiData(null);

      try {
        const lookupUrl = `https://nominatim.openstreetmap.org/lookup?format=jsonv2&osm_ids=${location.osm_type.charAt(0).toUpperCase()}${location.osm_id}&extratags=1`;
        const lookupRes = await fetch(lookupUrl);
        if (!lookupRes.ok) throw new Error("Nominatim lookup failed");

        const lookupData = await lookupRes.json();
        const wikiTag = lookupData[0]?.extratags?.wikipedia;
        if (!wikiTag) throw new Error("No Wikipedia article found");

        const [lang, title] = wikiTag.split(":");
        const wikiApiUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages&exintro=true&explaintext=true&pithumbsize=300&titles=${encodeURIComponent(title)}&origin=*`;

        const wikiRes = await fetch(wikiApiUrl);
        if (!wikiRes.ok) throw new Error("Wikipedia API fetch failed");

        const wikiApiData = await wikiRes.json();
        const page = Object.values(wikiApiData.query.pages)[0];

        if (page?.extract) {
          setWikiData({
            title: page.title,
            extract: page.extract,
            imageUrl: page.thumbnail?.source,
            url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
          });
        } else {
          throw new Error("No summary found for Wikipedia page.");
        }
      } catch (err) {
        console.error("Error fetching Wiki data:", err);
        setWikiData({ error: err.message });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWikiData();
  }, [location]);

  if (isLoading) {
    return (
      <div className="w-full p-4 bg-white border border-gray-200 rounded-lg shadow-md">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-700">Loading info...</span>
        </div>
      </div>
    );
  }

  if (!wikiData) return null;

  if (wikiData.error) {
    return (
      <div className="w-full p-4 bg-white border border-gray-200 rounded-lg shadow-md">
        <p className="text-red-500 text-center">Could not load information.</p>
        <p className="text-xs text-gray-500 text-center mt-1">{wikiData.error}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full p-2 bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4">
        {wikiData.imageUrl && (
          <img
            src={wikiData.imageUrl}
            alt={wikiData.title}
            className="w-full sm:w-1/3 h-auto object-cover rounded-md"
          />
        )}
        <div className="flex-1">
          <h3 className="text-md font-bold mb-2">{wikiData.title}</h3>
          <p className="text-sm text-gray-700 max-h-20 overflow-y-auto mb-3">
            {wikiData.extract}
          </p>
          <a
            href={wikiData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 text-sm hover:underline"
          >
            Read more
          </a>
        </div>
      </div>
    </div>
  );
}
