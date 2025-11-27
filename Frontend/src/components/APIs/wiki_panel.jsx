"use client";

import React, { useEffect, useState } from "react";

export default function WikiPanel({ location }) {
  const [wikiData, setWikiData] = useState(null);

  useEffect(() => {
    if (!location) {
      setWikiData(null);
      return;
    }

    const fetchWikiData = async () => {
      setWikiData(null);

      try {
        let wikiTag;

        // First, try Nominatim lookup
        if (location.osm_id && location.osm_type) {
          const lookupUrl = `https://nominatim.openstreetmap.org/lookup?format=jsonv2&osm_ids=${location.osm_type.charAt(0).toUpperCase()}${location.osm_id}&extratags=1`;
          const lookupRes = await fetch(lookupUrl);
          if (lookupRes.ok) {
            const lookupData = await lookupRes.json();
            wikiTag = lookupData[0]?.extratags?.wikipedia;
          }
        }

        // Determine the initial search
        let lang = "vi"; // Vietnamese first
        let title = location.name;

        if (wikiTag) {
          [lang, title] = wikiTag.split(":");
        }

        // Fetch Vietnamese Wikipedia page
        const wikiApiUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages|langlinks&exintro=true&explaintext=true&pithumbsize=300&titles=${encodeURIComponent(title)}&lllimit=1&origin=*`;
        const wikiRes = await fetch(wikiApiUrl);
        if (!wikiRes.ok) throw new Error("Wikipedia API fetch failed");

        const wikiApiData = await wikiRes.json();
        const page = Object.values(wikiApiData.query.pages)[0];

        if (page?.extract) {
          // Try to get English version if exists
          const enLink = page.langlinks?.find(link => link.lang === "en")?.["*"];
          const finalTitle = enLink || page.title;
          const finalLang = enLink ? "en" : lang;

          setWikiData({
            title: finalTitle,
            extract: page.extract,
            imageUrl: page.thumbnail?.source,
            url: `https://${finalLang}.wikipedia.org/wiki/${encodeURIComponent(finalTitle)}`,
          });
        }
      } catch (err) {
        console.error("Error fetching Wiki data:", err);
      }
    };

    fetchWikiData();
  }, [location]);

  if (!wikiData) return null;

  return (
    <div className="flex w-full p-2 bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-x-4">
        {wikiData.imageUrl && (
          <img
            src={wikiData.imageUrl}
            alt={wikiData.title}
            className="w-full sm:w-1/3 h-auto max-h-45 object-cover rounded-md"
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
