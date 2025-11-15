export default function OpportunityDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Opportunity Details</h1>
      <p className="text-gray-600">ID: {params.id}</p>
      <p className="text-gray-600">Details page - Coming soon</p>
    </div>
  )
}

