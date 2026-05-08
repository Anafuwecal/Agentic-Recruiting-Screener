import { z } from "zod";
import axios from "axios";
import * as cheerio from "cheerio";

export const portfolioAnalysisTool = {
  name: "analyze_portfolio",
  description: "Analyzes a portfolio website and extracts technologies",
  parameters: {
    type: "object",
    properties: {
      portfolio_url: {
        type: "string",
        format: "uri",
        description: "Portfolio website URL",
      },
    },
    required: ["portfolio_url"],
  },
  execute: async ({ portfolio_url }: { portfolio_url: string }) => {
    try {
      const response = await axios.get(portfolio_url, {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RecruitmentBot/1.0)",
        },
      });

      const $ = cheerio.load(response.data);
      const title = $("title").text();
      const bodyText = $("body").text().toLowerCase();

      const techKeywords = [
        "react",
        "vue",
        "angular",
        "node",
        "python",
        "typescript",
        "javascript",
        "docker",
        "aws",
        "postgresql",
      ];

      const foundTechs = techKeywords.filter((tech) =>
        bodyText.includes(tech)
      );

      const hasProjects = $("section")
        .filter((_, el) => {
          const text = $(el).text().toLowerCase();
          return (
            text.includes("project") ||
            text.includes("work") ||
            text.includes("portfolio")
          );
        })
        .length > 0;

      return {
        url: portfolio_url,
        title,
        technologies_found: foundTechs,
        has_projects_section: hasProjects,
        is_accessible: true,
        quality_score: foundTechs.length > 3 && hasProjects ? 80 : 40,
      };
    } catch (error: any) {
      return {
        url: portfolio_url,
        error: error.message,
        is_accessible: false,
        quality_score: 0,
      };
    }
  },
};