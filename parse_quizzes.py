import re
import json
import os

def normalize_question(q):
    """
    Converts a question object from the raw format (string answer, 'question' key)
    to the standard format (index answer, 'text' key).
    """
    # 1. Map 'question' to 'text'
    text = q.get('question', '')
    
    # 2. Map 'answer' string to 'correctAnswer' index
    raw_answer = q.get('answer', '')
    options = q.get('options', [])
    
    correct_index = 0
    
    # Try to find the exact answer string in options
    try:
        correct_index = options.index(raw_answer)
    except ValueError:
        # If exact match fails, try matching by the letter prefix (e.g., "A. ")
        # Extract the letter from the answer (e.g., "A")
        ans_letter_match = re.match(r'^([A-D])\.', raw_answer, re.IGNORECASE)
        if ans_letter_match:
            ans_letter = ans_letter_match.group(1).upper()
            # Find the option that starts with this letter
            for i, opt in enumerate(options):
                if opt.upper().startswith(f"{ans_letter}."):
                    correct_index = i
                    break
    
    return {
        q: text,
        options: options,
        ans: correct_index,
        hint: q.get('hint', ''),
        rat: q.get('rationalization', '')
    }

def parse_json_like(input_path, output_path, var_name):
    """
    Parses files that are roughly JSON (Part 1 and Part 2).
    """
    print(f"Parsing {input_path}...")
    
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Clean up the content
    # Remove [cite_start] tags
    content = content.replace('[cite_start]', '')
    
    # Remove [cite: ...] patterns
    content = re.sub(r'\[cite: [0-9, ]+\]', '', content)
    
    # Fix potential trailing commas in arrays/objects which JSON spec doesn't allow but JS does
    content = re.sub(r',\s*]', ']', content)
    content = re.sub(r',\s*}', '}', content)

    try:
        data = json.loads(content)
        
        # Normalize each question
        normalized_data = [normalize_question(q) for q in data]
        
        # Write to JS file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(f"export const {var_name} = ")
            json.dump(normalized_data, f, indent=2)
            f.write(";\n")
        print(f"Successfully created {output_path} with {len(normalized_data)} questions.")
        return True
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON in {input_path}: {e}")
        # Print context
        start = max(0, e.pos - 50)
        end = min(len(content), e.pos + 50)
        print(f"Context: ...{content[start:end]}...")
        return False

def parse_text_format(input_path, output_path, var_name):
    """
    Parses files in the custom text format (Part 3).
    """
    print(f"Parsing {input_path}...")
    
    with open(input_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    questions = []
    current_q = {}
    
    # Regex patterns
    numbered_q_pattern = re.compile(r'^(\d+)\.\s+(.*)')
    label_q_pattern = re.compile(r'^Question:\s*(.*)', re.IGNORECASE)
    options_pattern = re.compile(r'^Options:\s*(.*)', re.IGNORECASE)
    answer_pattern = re.compile(r'^Answer:\s*(.*)', re.IGNORECASE)
    hint_pattern = re.compile(r'^Hint:\s*(.*)', re.IGNORECASE)
    rat_pattern = re.compile(r'^Rationalization:\s*(.*)', re.IGNORECASE)

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Check for Question start
        q_match = label_q_pattern.match(line)
        num_match = numbered_q_pattern.match(line)

        if q_match or num_match:
            # Save previous question
            if current_q:
                questions.append(normalize_question(current_q))
                current_q = {}
            
            if q_match:
                current_q['question'] = q_match.group(1)
            elif num_match:
                current_q['id'] = int(num_match.group(1))
                current_q['question'] = num_match.group(2)
            
            if 'id' not in current_q:
                current_q['id'] = len(questions) + 1
            continue

        # Check for Options
        opt_match = options_pattern.match(line)
        if opt_match:
            raw_options = opt_match.group(1)
            if '|' in raw_options:
                options = [opt.strip() for opt in raw_options.split('|')]
            else:
                options = [opt.strip() for opt in raw_options.split(';')]
            current_q['options'] = [o for o in options if o]
            continue

        # Check for Answer
        ans_match = answer_pattern.match(line)
        if ans_match:
            current_q['answer'] = ans_match.group(1)
            continue

        # Check for Hint
        hint_match = hint_pattern.match(line)
        if hint_match:
            current_q['hint'] = hint_match.group(1)
            continue

        # Check for Rationalization
        rat_match = rat_pattern.match(line)
        if rat_match:
            current_q['rationalization'] = rat_match.group(1)
            continue

    # Append the last question
    if current_q:
        questions.append(normalize_question(current_q))

    # Write to JS file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"export const {var_name} = ")
        json.dump(questions, f, indent=2)
        f.write(";\n")
    
    print(f"Successfully created {output_path} with {len(questions)} questions.")

if __name__ == "__main__":
    base_path = r"c:\Users\Dadayyy\Desktop\cogniupdate\cogniquest-master"
    
    # Part 1
    parse_json_like(
        os.path.join(base_path, "quizzes", "BPED COMPREHENSIVE EXAM Part 1.txt"),
        os.path.join(base_path, "src", "utils", "bpedData.js"),
        "bpedPart1"
    )
    
    # Part 2
    parse_json_like(
        os.path.join(base_path, "quizzes", "BPED COMPREHENSIVE EXAM PART 2.txt"),
        os.path.join(base_path, "src", "utils", "bpedData2.js"),
        "bpedPart2"
    )
    
    # Part 3
    parse_text_format(
        os.path.join(base_path, "quizzes", "BPED COMPREHENSIVE EXAM PART 3.txt"),
        os.path.join(base_path, "src", "utils", "bpedData3.js"),
        "bpedPart3"
    )
