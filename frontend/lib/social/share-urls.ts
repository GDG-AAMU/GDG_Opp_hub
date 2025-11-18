/**
 * Generate share URLs for social platforms
 */

interface Opportunity {
  opportunity_type: string
  job_title: string
  company_name: string
}

interface ShareData {
  linkedin: string
  webShare: {
    title: string
    text: string
    url: string
  }
}

/**
 * Generate share URLs and data for an opportunity
 */
export function getShareData(opportunity: Opportunity, pageUrl: string): ShareData {
  const text = `Check out this ${opportunity.opportunity_type} opportunity: ${opportunity.job_title} at ${opportunity.company_name}`
  const title = `${opportunity.job_title} at ${opportunity.company_name}`

  return {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`,
    webShare: {
      title,
      text,
      url: pageUrl
    }
  }
}

