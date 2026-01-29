import { useParams, useSearchParams } from 'react-router-dom';
import ComparisonPresentation from './ComparisonPresentation';

export default function PublicPresentation() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const signature = searchParams.get('signature');
    return <ComparisonPresentation isPublic comparisonId={id} signature={signature} />;
}
