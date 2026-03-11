import asyncio
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
from backend.core.config import settings
from backend.core.database import AsyncSessionLocal
from backend.models.document import Document

# 50 Technical Documents Data
DOCUMENTS_DATA = [
    # Cloud Computing
    {"title": "Architecting the Cloud", "author": "Michael J. Kavis", "category": "Cloud Computing", "year": 2014, "isbn": "9781118617618", "summary": "A guide to designing and implementing cloud-based systems with a focus on business value and technical scalability.", "keywords": ["AWS", "Azure", "Cloud Strategy", "Architecture"]},
    {"title": "Cloud Native Patterns", "author": "Cornelia Davis", "category": "Cloud Computing", "year": 2019, "isbn": "9781617294297", "summary": "Explores patterns for building software that lives in the cloud, covering microservices, state management, and resilience.", "keywords": ["Cloud Native", "Kubernetes", "Scalability"]},
    {"title": "Azure Strategy and Implementation Guide", "author": "Peter De Tender", "category": "Cloud Computing", "year": 2020, "isbn": "9781484257128", "summary": "Comprehensive overview of Azure services and how to implement them in enterprise environments.", "keywords": ["Azure", "Enterprise", "Migration"]},
    {"title": "AWS Cookbook", "author": "John Culkin", "category": "Cloud Computing", "year": 2021, "isbn": "9781492092604", "summary": "Practical recipes for solving common AWS infrastructure and automation challenges.", "keywords": ["AWS", "DevOps", "Automation"]},
    {"title": "Google Cloud Platform in Action", "author": "John J. Geewax", "category": "Cloud Computing", "year": 2018, "isbn": "9781617293924", "summary": "A hands-on guide to building and deploying applications on Google Cloud Platform.", "keywords": ["GCP", "Kubernetes", "Dataflow"]},

    # Distributed Systems
    {"title": "Designing Data-Intensive Applications", "author": "Martin Kleppmann", "category": "Distributed Systems", "year": 2017, "isbn": "9781449373320", "summary": "The definitive guide to understanding the principles and trade-offs of modern data systems.", "keywords": ["Distributed Systems", "Databases", "Scalability", "Reliability"]},
    {"title": "Distributed Systems: Principles and Paradigms", "author": "Andrew S. Tanenbaum", "category": "Distributed Systems", "year": 2023, "isbn": "9781530281756", "summary": "A comprehensive textbook covering the fundamental concepts and architectures of distributed systems.", "keywords": ["Networks", "Consensus", "Fault Tolerance"]},
    {"title": "Building Microservices", "author": "Sam Newman", "category": "Distributed Systems", "year": 2021, "isbn": "9781492034025", "summary": "Focuses on the practical aspects of designing, building, and deploying microservices architectures.", "keywords": ["Microservices", "Architecture", "Evolutionary Design"]},
    {"title": "Patterns of Distributed Systems", "author": "Unmesh Joshi", "category": "Distributed Systems", "year": 2022, "isbn": "9781098114497", "summary": "Deep dive into low-level patterns like Replication, Quorum, and Leader Election.", "keywords": ["Consensus", "Replication", "System Design"]},
    {"title": "Site Reliability Engineering", "author": "Niall Richard Murphy", "category": "Distributed Systems", "year": 2016, "isbn": "9781491929124", "summary": "Google's approach to operating large-scale distributed systems with high reliability.", "keywords": ["SRE", "Operations", "Automation"]},

    # Frontend
    {"title": "React Key Concepts", "author": "Maximilian Schwarzmüller", "category": "Frontend", "year": 2022, "isbn": "9781803233772", "summary": "A comprehensive guide to modern React development including hooks, context, and performance optimization.", "keywords": ["React", "JavaScript", "Web Development"]},
    {"title": "JavaScript: The Definitive Guide", "author": "David Flanagan", "category": "Frontend", "year": 2020, "isbn": "9781491952023", "summary": "The essential reference for JavaScript developers, covering everything from core syntax to modern APIs.", "keywords": ["JavaScript", "ES6", "Programming"]},
    {"title": "CSS Secrets", "author": "Lea Verou", "category": "Frontend", "year": 2015, "isbn": "9781449372637", "summary": "Practical solutions to everyday CSS challenges using modern standards.", "keywords": ["CSS", "Design", "Layout"]},
    {"title": "Vue.js 3 By Example", "author": "John Au-Yeung", "category": "Frontend", "year": 2021, "isbn": "9781800561588", "summary": "Hands-on guide to building reactive web applications using the Vue.js framework.", "keywords": ["Vue", "Frontend", "Frameworks"]},
    {"title": "TypeScript Quickly", "author": "Yakov Fain", "category": "Frontend", "year": 2020, "isbn": "9781617294280", "summary": "Learn TypeScript by building real-world applications and mastering its static type system.", "keywords": ["TypeScript", "JavaScript", "Static Typing"]},

    # Backend
    {"title": "Node.js Design Patterns", "author": "Mario Casciaro", "category": "Backend", "year": 2020, "isbn": "9781839214110", "summary": "Master the art of building scalable and maintainable Node.js applications using proven patterns.", "keywords": ["Node.js", "Design Patterns", "Asynchronous Programming"]},
    {"title": "Clean Architecture", "author": "Robert C. Martin", "category": "Backend", "year": 2017, "isbn": "9780134494166", "summary": "A craftsman's guide to software structure and design, emphasizing independence of frameworks.", "keywords": ["Architecture", "Solid Principles", "Clean Code"]},
    {"title": "Python Microservices Development", "author": "Tarek Ziadé", "category": "Backend", "year": 2017, "isbn": "9781787287211", "summary": "Build and deploy scalable Python microservices using modern tools and techniques.", "keywords": ["Python", "Microservices", "Asyncio"]},
    {"title": "Spring Boot in Action", "author": "Craig Walls", "category": "Backend", "year": 2015, "isbn": "9781617292545", "summary": "Learn how to build Java-based backend services quickly with the Spring Boot framework.", "keywords": ["Java", "Spring Boot", "Enterprise"]},
    {"title": "Rust for Rustaceans", "author": "Jon Gjengset", "category": "Backend", "year": 2021, "isbn": "9781718501850", "summary": "Advanced guide to writing idiomatically correct and high-performance Rust code.", "keywords": ["Rust", "Performance", "Systems Programming"]},

    # DevOps
    {"title": "The Phoenix Project", "author": "Gene Kim", "category": "DevOps", "year": 2013, "isbn": "9780988262591", "summary": "A novel about IT, DevOps, and helping your business win through collaboration.", "keywords": ["DevOps", "Agile", "Culture"]},
    {"title": "Kubernetes: Up and Running", "author": "Kelsey Hightower", "category": "DevOps", "year": 2022, "isbn": "9781098110208", "summary": "Practical guide to managing containerized applications at scale using Kubernetes.", "keywords": ["Kubernetes", "Docker", "Containers"]},
    {"title": "Terraform: Up and Running", "author": "Yevgeniy Brikman", "category": "DevOps", "year": 2022, "isbn": "9781098116743", "summary": "Learn how to manage infrastructure as code with Terraform across multiple cloud providers.", "keywords": ["Terraform", "Infrastructure as Code", "IaC"]},
    {"title": "Continuous Delivery", "author": "Jez Humble", "category": "DevOps", "year": 2010, "isbn": "9780321601919", "summary": "Principles and practices for reliable software releases through automation.", "keywords": ["CI/CD", "Automation", "Testing"]},
    {"title": "Ansible: Up and Running", "author": "Lorin Hochstein", "category": "DevOps", "year": 2022, "isbn": "9781098109158", "summary": "Practical guide to automating configuration management and application deployment with Ansible.", "keywords": ["Ansible", "Automation", "Configuration Management"]},

    # Databases
    {"title": "Seven Databases in Seven Weeks", "author": "Luc Perkins", "category": "Databases", "year": 2018, "isbn": "9781680502534", "summary": "A guide to understanding diverse database technologies including NoSQL and Relational models.", "keywords": ["NoSQL", "SQL", "Database Design"]},
    {"title": "SQL Performance Explained", "author": "Markus Winand", "category": "Databases", "year": 2012, "isbn": "9783950307825", "summary": "A book for developers that focuses on improving SQL query performance through indexing.", "keywords": ["SQL", "Indexing", "Optimization"]},
    {"title": "Database Internals", "author": "Alex Petrov", "category": "Databases", "year": 2019, "isbn": "9781492040347", "summary": "Deep dive into the storage engines and distributed systems that power modern databases.", "keywords": ["Storage Engines", "B-Trees", "LSM-Trees"]},
    {"title": "PostgreSQL: Up and Running", "author": "Regina Obe", "category": "Databases", "year": 2017, "isbn": "9781491963418", "summary": "Hands-on guide to the advanced features of the PostgreSQL relational database.", "keywords": ["PostgreSQL", "SQL", "Open Source"]},
    {"title": "MongoDB: The Definitive Guide", "author": "Shannon Bradshaw", "category": "Databases", "year": 2019, "isbn": "9781491954461", "summary": "The complete reference for building and managing applications with MongoDB.", "keywords": ["MongoDB", "NoSQL", "Document Database"]},

    # AI/ML
    {"title": "Hands-On Machine Learning", "author": "Aurélien Géron", "category": "AI/ML", "year": 2022, "isbn": "9781098125615", "summary": "Learn machine learning basics and deep learning using Scikit-Learn, Keras, and TensorFlow.", "keywords": ["Machine Learning", "Deep Learning", "Python"]},
    {"title": "Generative Deep Learning", "author": "David Foster", "category": "AI/ML", "year": 2023, "isbn": "9781098134181", "summary": "Explore GANs, VAEs, and transformers to generate images, text, and music.", "keywords": ["Generative AI", "GANs", "Transformers"]},
    {"title": "Artificial Intelligence: A Modern Approach", "author": "Stuart Russell", "category": "AI/ML", "year": 2020, "isbn": "9780134610993", "summary": "The standard university textbook covering the breadth and depth of AI history and techniques.", "keywords": ["AI", "Search", "Logic", "Robotics"]},
    {"title": "Deep Learning with Python", "author": "François Chollet", "category": "AI/ML", "year": 2021, "isbn": "9781617296864", "summary": "Practical introduction to deep learning using the Keras library by its creator.", "keywords": ["Deep Learning", "Keras", "Neural Networks"]},
    {"title": "Natural Language Processing with Transformers", "author": "Lewis Tunstall", "category": "AI/ML", "year": 2022, "isbn": "9781098103248", "summary": "Learn how to use Hugging Face transformers for text classification, search, and summarization.", "keywords": ["NLP", "Transformers", "BERT", "GPT"]},

    # Security
    {"title": "Practical Malware Analysis", "author": "Michael Sikorski", "category": "Security", "year": 2012, "isbn": "9781593272906", "summary": "A hands-on guide to dissecting malicious software and understanding its behavior.", "keywords": ["Security", "Malware", "Reverse Engineering"]},
    {"title": "The Web Application Hacker's Handbook", "author": "Dafydd Stuttard", "category": "Security", "year": 2011, "isbn": "9781118026472", "summary": "The classic guide to discovering and exploiting security flaws in web applications.", "keywords": ["Web Security", "Hacking", "Penetration Testing"]},
    {"title": "Cryptography Engineering", "author": "Niels Ferguson", "category": "Security", "year": 2010, "isbn": "9780470474242", "summary": "Practical guide to implementing cryptographic systems safely in software.", "keywords": ["Cryptography", "Encryption", "Security Engineering"]},
    {"title": "Black Hat Python", "author": "Justin Seitz", "category": "Security", "year": 2021, "isbn": "9781718501126", "summary": "Python programming for hackers and reverse engineers, covering network tools and exploits.", "keywords": ["Python", "Hacking", "Network Security"]},
    {"title": "Zero Trust Networks", "author": "Evan Gilman", "category": "Security", "year": 2017, "isbn": "9781491962190", "summary": "Building secure systems in untrusted networks using a zero-trust model.", "keywords": ["Zero Trust", "Network Security", "Cloud Security"]},

    # Architecture
    {"title": "Fundamentals of Software Architecture", "author": "Mark Richards", "category": "Architecture", "year": 2020, "isbn": "9781492040453", "summary": "Overview of various architectural patterns and how to make effective technical decisions.", "keywords": ["Architecture", "System Design", "Decision Making"]},
    {"title": "Domain-Driven Design", "author": "Eric Evans", "category": "Architecture", "year": 2003, "isbn": "9780321125217", "summary": "Tackling complexity in the heart of software by matching design to a domain model.", "keywords": ["DDD", "Domain Model", "Strategic Design"]},
    {"title": "Building Evolutionary Architectures", "author": "Neal Ford", "category": "Architecture", "year": 2017, "isbn": "9781491986646", "summary": "How to design software systems that can evolve gracefully over time.", "keywords": ["Evolutionary Design", "Fitness Functions", "Agile Architecture"]},
    {"title": "Microservices Patterns", "author": "Chris Richardson", "category": "Architecture", "year": 2018, "isbn": "9781617294549", "summary": "Practical patterns for solving common problems in microservice architectures like Saga and CQRS.", "keywords": ["Microservices", "Patterns", "Saga Pattern"]},
    {"title": "Architecture Patterns with Python", "author": "Harry Percival", "category": "Architecture", "year": 2020, "isbn": "9781492052203", "summary": "Enabling test-driven development and domain-driven design in Python applications.", "keywords": ["Python", "Architecture", "TDD"]},

    # Leadership
    {"title": "The Manager's Path", "author": "Camille Fournier", "category": "Leadership", "year": 2017, "isbn": "9781491973899", "summary": "A guide for tech leaders navigating their careers from engineer to executive.", "keywords": ["Leadership", "Management", "Career Path"]},
    {"title": "Radical Candor", "author": "Kim Scott", "category": "Leadership", "year": 2017, "isbn": "9781250135360", "summary": "How to be a kick-ass boss without losing your humanity through direct and caring feedback.", "keywords": ["Management", "Communication", "Culture"]},
    {"title": "Turn the Ship Around!", "author": "L. David Marquet", "category": "Leadership", "year": 2013, "isbn": "9781591846406", "summary": "A true story of turning followers into leaders by decentralizing decision making.", "keywords": ["Leadership", "Empowerment", "Decentralization"]},
    {"title": "Staff Engineer", "author": "Will Larson", "category": "Leadership", "year": 2021, "isbn": "9781736410202", "summary": "Exploring the role of the staff-level individual contributor in engineering organizations.", "keywords": ["Staff Engineering", "IC Path", "Technical Leadership"]},
    {"title": "Accelerate", "author": "Nicole Forsgren", "category": "Leadership", "year": 2018, "isbn": "9781942788331", "summary": "The science of lean software and DevOps, focusing on how to build high-performing organizations.", "keywords": ["Metrics", "Performance", "Lean", "DevOps"]},
]

async def seed_mysql():
    print("Seeding MySQL Documents...")
    async with AsyncSessionLocal() as session:
        # Check if already seeded
        result = await session.execute(Document.__table__.select().limit(1))
        if result.first():
            print("MySQL already seeded. Skipping document insertion.")
            # Still fetch docs to return for Qdrant seeding
            res = await session.execute(Document.__table__.select())
            return res.fetchall()

        new_docs = []
        for d in DOCUMENTS_DATA:
            doc = Document(
                id=str(uuid.uuid4()),
                title=d["title"],
                author=d["author"],
                isbn=d["isbn"],
                publication_year=d["year"],
                category=d["category"],
                summary=d["summary"],
                keywords=d["keywords"],
                physical_location=f"Shelf {uuid.uuid4().hex[:2].upper()} / Row {uuid.uuid4().hex[:2].upper()}",
                digital_format="PDF",
                availability=True
            )
            new_docs.append(doc)
            session.add(doc)
        
        await session.commit()
        print(f"Successfully inserted {len(new_docs)} documents into MySQL.")
        return new_docs

async def seed_qdrant(documents):
    print("Seeding Qdrant Vector DB...")
    q_client = QdrantClient(url=settings.QDRANT_URL)
    collection_name = "document_embeddings"

    # Recreate collection
    q_client.recreate_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )

    # Initialize Embedding Model
    print("Loading embedding model (all-MiniLM-L6-v2)...")
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

    points = []
    for doc in documents:
        # Embed the summary
        vector = model.encode(doc.summary).tolist()
        
        points.append(PointStruct(
            id=doc.id,
            vector=vector,
            payload={
                "title": doc.title,
                "summary_excerpt": doc.summary[:300],
                "category": doc.category,
                "keywords": doc.keywords
            }
        ))
    
    q_client.upsert(
        collection_name=collection_name,
        points=points
    )
    print(f"Successfully upserted {len(points)} embeddings into Qdrant.")

async def main():
    try:
        docs = await seed_mysql()
        await seed_qdrant(docs)
    except Exception as e:
        print(f"Error during seeding: {e}")

if __name__ == "__main__":
    asyncio.run(main())
