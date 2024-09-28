import React, { useEffect, useState, useRef, useCallback } from "react";
import { MOCK_DATA } from "./dummy/dummyData";
import { SyncLoader } from "react-spinners";

interface MockData {
  productId: string;
  productName: string;
  price: number;
  boughtDate: string;
}

interface MockDataResponse {
  datas: MockData[];
  isEnd: boolean;
}

const InfiniteScroll: React.FC = () => {
  const [products, setProducts] = useState<MockData[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [isEnd, setIsEnd] = useState(false);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const page = useRef(-2);

  const PER_PAGE = 10;

  const checkPage = page.current >= 0;

  const getMockData = useCallback(
    (pageNum: number): Promise<MockDataResponse> => {
      return new Promise<MockDataResponse>((resolve) => {
        setTimeout(() => {
          const start = PER_PAGE * pageNum; // 현재 페이지에서 시작 인덱스 계산
          const datas: MockData[] = MOCK_DATA.slice(start, start + PER_PAGE);
          const isEnd = start + PER_PAGE >= MOCK_DATA.length; // 마지막 페이지인지 확인

          resolve({ datas, isEnd });
        }, 1500);
      });
    },
    []
  );

  const loadMoreProducts = useCallback(async () => {
    // 로딩 중이거나 마지막 페이지에 도달한 경우, 함수를 종료

    console.log("로드 함수 실행!");
    if (isFetching || isEnd) return;

    setIsFetching(true); // 로딩 상태 시작

    // 데이터 가져오기
    const { datas, isEnd: endReached } = await getMockData(page.current);

    // 데이터를 성공적으로 로드했을 경우
    if (datas.length > 0 && page.current >= 0) {
      setProducts((prev) => [...prev, ...datas]);
      setTotalPrice(
        (prev) => prev + datas.reduce((sum, item) => sum + item.price, 0)
      );
    }
    page.current += 1; // 페이지 증가

    setIsEnd(endReached); // 마지막 페이지 도달 여부를 업데이트
    setIsFetching(false); // 로딩 상태 종료
  }, [isFetching, isEnd, getMockData]); // 의존성 배열 수정

  useEffect(() => {
    // 초기 데이터 로드
    loadMoreProducts();
  }, []);

  useEffect(() => {
    const currentLoadingRef = loadingRef.current; // 현재 ref 값 저장

    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 1.0,
    };

    observer.current = new IntersectionObserver((entries) => {
      // 관찰 중인 요소가 보일 때만 실행
      if (entries[0].isIntersecting && !isFetching && !isEnd) {
        loadMoreProducts(); // 로딩 요소가 보일 때 추가 데이터 로드
      }
    }, options);

    if (currentLoadingRef) {
      observer.current.observe(currentLoadingRef); // 로딩 요소 관찰 시작
    }

    return () => {
      if (observer.current && currentLoadingRef) {
        observer.current.unobserve(currentLoadingRef); // 관찰 종료
      }
    };
  }, [loadingRef, loadMoreProducts, isFetching, isEnd]); // 의존성 배열 추가

  return (
    <>
      {checkPage && (
        <div>
          <div>
            {products.map((product, idx) => (
              <div key={product.productId + "_" + idx}>
                상품명: {product.productName} - 가격: {product.price}
              </div>
            ))}
          </div>
          {isFetching && <SyncLoader />} {/* 로딩 중일 때만 표시 */}
          <div className="text-blue-500">총액: {totalPrice}</div>
          <div
            ref={loadingRef}
            style={{
              height: "20px",
              visibility: isFetching ? "visible" : "hidden",
            }}
          />{" "}
          {/* IntersectionObserver를 위한 ref */}
        </div>
      )}
    </>
  );
};

export default InfiniteScroll;
