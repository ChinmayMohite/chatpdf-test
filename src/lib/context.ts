import { convertToAscii } from './utils';
import { getEmbeddings } from './embeddings';

export async function getMatchesFromEmbeddings(
  embeddings: number[],
  file_key: string
) {
  const namespace = convertToAscii(file_key);
  const options = {
    method: 'POST',
    url: `${process.env.PINECONE_HOST}/query`,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'Api-Key': `${process.env.PINECONE_API_KEY}`,
    },
    data: {
      includeValues: false,
      includeMetadata: true,
      namespace: namespace,
      topK: 5,
      vector: embeddings,
    },
  };
  /*
    axios
        .request(options)
        .then(function (response) {
            // return response.data
        })
        .catch(function (error) {
            console.error("Get context Error: ", error);
        });
    */

  // I have no idea why axios is not working here, have to use fetch
  try {
    const res = await fetch(options.url, {
      method: 'POST',
      headers: options.headers,
      body: JSON.stringify(options.data),
    });
    const data = await res.json();
    // data include all realative text s
    return data;
  } catch (error) {
    console.error('Get context Error: ', error);
  }
}

export async function getContext(query: string, file_key: string) {
  try {
    const queryEmbeddings = await getEmbeddings(query);
    const candidateVectors = await getMatchesFromEmbeddings(
      queryEmbeddings,
      file_key
    );
    const matchVectors = (
      candidates: { result: any[]; matches: any[] },
      requrieScore: number
    ): string => {
      const context = candidates.matches
        .reduce(
          (
            accumulator: string,
            match: { score: number; metadata: { text: string } }
          ) => {
            if (match.score > requrieScore) {
              accumulator += match.metadata.text + '\n';
            }
            return accumulator;
          },
          ''
        )
        .trim();
        return context;
      };
      
      let baseScore = 0.8;
      let contextText = matchVectors(candidateVectors, baseScore);
      while (contextText === '' && baseScore > 0.6) {
        baseScore -= 0.05;
        contextText = matchVectors(candidateVectors, baseScore);
      }
      
      const context = {
        baseScore: baseScore,
        text: contextText,
      };
      // context include the best match text chunk
      // console.log(context)
    return context;
  } catch (error) {
    console.error('Error when getting context: ', error);
    throw error;
  }
}