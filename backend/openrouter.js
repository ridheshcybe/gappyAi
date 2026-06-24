import { pipeline, env } from '@huggingface/transformers';

// Clear any global token to ensure public access works flawlessly
env.hfToken = null; 

async function run(data) {
    console.log("Loading SmolLM2-135M (ONNX)...");
    
    const generator = await pipeline(
        'text-generation', 
        'HuggingFaceTB/SmolLM2-135M-Instruct',
        { progress_callback: (progress) => console.log(`Downloading: ${Math.round(progress.progress || 0)}%`) }
    );

    const messages = [{ role: 'user', content: data }];

    console.log("\nGenerating answer...\n");

    const output = await generator(messages, {
        max_new_tokens: 100,
        temperature: 0.7,
        do_sample: true,
    });

    console.log("Result:");
    console.log(output[0]);
}

run("error 404 meaning").catch(console.error);
